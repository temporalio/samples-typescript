import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Runtime, DefaultLogger, Worker, WorkflowBundleWithSourceMap, bundleWorkflowCode } from '@temporalio/worker';
import { describe, before, after, it } from 'mocha';
import { oneAtATimeWorkflow } from '../workflows';
import { currentWorkflowIdQuery } from '../shared';
import * as activities from '../activities';
import assert from 'assert';
import { nanoid } from 'nanoid';
import { EventEmitter, once } from 'node:events';

const taskQueue = 'test' + new Date().toLocaleDateString('en-US');

describe('lock workflow', function () {
  this.timeout(10000);
  let worker: Worker;
  let env: TestWorkflowEnvironment;
  let workflowBundle: WorkflowBundleWithSourceMap;
  const lockedEvents = new EventEmitter();

  before(async function () {
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.create();

    workflowBundle = await bundleWorkflowCode({
      workflowsPath: require.resolve('../workflows'),
      logger: new DefaultLogger('WARN'),
    });
  });

  beforeEach(async function () {
    worker = await Worker.create({
      connection: env.nativeConnection,
      workflowBundle,
      activities: {
        ...activities.createActivities(env.client),
        async notifyLocked(resourceId: string, releaseSignalName: string) {
          lockedEvents.emit('locked', { resourceId, releaseSignalName });
        },
        async notifyUnlocked(resourceId: string) {
          lockedEvents.emit('unlocked', { resourceId });
        },
      },
      taskQueue,
    });
  });

  after(async function () {
    await env.teardown();
  });

  it('handles locking and unlocking', async function () {
    await worker.runUntil(async function () {
      const testWorkflowId = 'test-' + nanoid();
      const lockWorkflowId = 'lock-' + nanoid();
      await env.client.workflow.start(oneAtATimeWorkflow, {
        taskQueue,
        workflowId: testWorkflowId,
        args: [lockWorkflowId, 1000, 1500],
      });

      await once(lockedEvents, 'locked');

      const lockWorkflowHandle = env.client.workflow.getHandle(lockWorkflowId);

      let currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId);

      await once(lockedEvents, 'unlocked');

      currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, null);
    });
  });

  it('automatically releases the lock after timeout', async function () {
    await worker.runUntil(async function () {
      const testWorkflowId1 = 'test-' + nanoid();
      const lockWorkflowId = 'lock-' + nanoid();
      await env.client.workflow.start(oneAtATimeWorkflow, {
        taskQueue,
        workflowId: testWorkflowId1,
        args: [lockWorkflowId, 10000 /* 10s */],
      });

      await once(lockedEvents, 'locked');

      const lockWorkflowHandle = env.client.workflow.getHandle(lockWorkflowId);
      let currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId1);

      const testWorkflowId2 = 'test-' + nanoid();
      await env.client.workflow.start(oneAtATimeWorkflow, {
        taskQueue,
        workflowId: testWorkflowId2,
        args: [lockWorkflowHandle.workflowId, 10000 /* 10s */],
      });

      await env.sleep('100ms');
      currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId1);

      await env.sleep('1200ms');

      currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId2);
    });
  });
});
