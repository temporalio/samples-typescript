import { TestWorkflowEnvironment } from '@temporalio/testing';
import { WorkflowHandle } from '@temporalio/client';
import { Runtime, DefaultLogger, Worker, WorkflowBundleWithSourceMap, bundleWorkflowCode } from '@temporalio/worker';
import { describe, before, after, it } from 'mocha';
import { lockWorkflow, oneAtATimeWorkflow } from '../workflows';
import { currentWorkflowIdQuery } from '../shared';
import * as activities from '../activities';
import assert from 'assert';
import { nanoid } from 'nanoid';

const taskQueue = 'test' + new Date().toLocaleDateString('en-US');

describe('lock workflow', function () {
  let runPromise: Promise<void>;
  let worker: Worker;
  let lockWorkflowHandle: WorkflowHandle<typeof lockWorkflow>;
  let env: TestWorkflowEnvironment;
  let workflowBundle: WorkflowBundleWithSourceMap;

  before(async function () {
    this.timeout(10000);
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
      activities: activities.createActivities(env.client),
      taskQueue,
    });

    lockWorkflowHandle = await env.workflowClient.start(lockWorkflow, {
      taskQueue,
      workflowId: 'lock-' + nanoid(),
    });
  });

  after(async function () {
    await env.teardown();
  });

  it('handles locking and unlocking', async function () {
    await worker.runUntil(async function () {
      const testWorkflowId = 'test-' + nanoid();
      const testWorkflowHandle = await env.workflowClient.start(oneAtATimeWorkflow, {
        taskQueue,
        workflowId: testWorkflowId,
        args: [lockWorkflowHandle.workflowId],
      });

      await env.sleep('100ms');

      let currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId);

      await testWorkflowHandle.result();

      currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, null);
    });
  });

  it('automatically releases the lock after timeout', async function () {
    await worker.runUntil(async function () {
      const testWorkflowId1 = 'test-' + nanoid();
      await env.workflowClient.start(oneAtATimeWorkflow, {
        taskQueue,
        workflowId: testWorkflowId1,
        args: [lockWorkflowHandle.workflowId, 10000 /* 10s */],
      });

      await env.sleep('100ms');
      let currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId1);

      const testWorkflowId2 = 'test-' + nanoid();
      await env.workflowClient.start(oneAtATimeWorkflow, {
        taskQueue,
        workflowId: testWorkflowId2,
        args: [lockWorkflowHandle.workflowId, 10000 /* 10s */],
      });

      await env.sleep('100ms');
      currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId1);

      await env.sleep('1300ms');
      currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
      assert.equal(currentWorkflowId, testWorkflowId2);
    });
  });
});
