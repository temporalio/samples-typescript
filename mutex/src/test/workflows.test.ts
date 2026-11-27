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
    env = await TestWorkflowEnvironment.createTimeSkipping();

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
        async notifyLocked(input: activities.NotifyLockedInput) {
          lockedEvents.emit('locked', input);
        },
        async notifyUnlocked(input: activities.NotifyUnlockedInput) {
          lockedEvents.emit('unlocked', input);
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
        args: [{ resourceId: lockWorkflowId, sleepForMs: 1000, lockTimeoutMs: 1500 }],
      });

      await once(lockedEvents, 'locked');

      const lockWorkflowHandle = env.client.workflow.getHandle(lockWorkflowId);

      let { workflowId: currentWorkflowId } = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId);

      await once(lockedEvents, 'unlocked');

      ({ workflowId: currentWorkflowId } = await lockWorkflowHandle.query(currentWorkflowIdQuery));
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
        args: [{ resourceId: lockWorkflowId, sleepForMs: 10000 /* 10s */ }],
      });

      await once(lockedEvents, 'locked');

      const lockWorkflowHandle = env.client.workflow.getHandle(lockWorkflowId);
      let { workflowId: currentWorkflowId } = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId1);

      const testWorkflowId2 = 'test-' + nanoid();
      await env.client.workflow.start(oneAtATimeWorkflow, {
        taskQueue,
        workflowId: testWorkflowId2,
        args: [{ resourceId: lockWorkflowHandle.workflowId, sleepForMs: 10000 /* 10s */ }],
      });

      await env.sleep('100ms');
      ({ workflowId: currentWorkflowId } = await lockWorkflowHandle.query(currentWorkflowIdQuery));
      assert.equal(currentWorkflowId, testWorkflowId1);

      await env.sleep('1200ms');

      ({ workflowId: currentWorkflowId } = await lockWorkflowHandle.query(currentWorkflowIdQuery));
      assert.equal(currentWorkflowId, testWorkflowId2);
    });
  });
});
