import { TestWorkflowEnvironment } from '@temporalio/testing';
import { WorkflowHandle } from '@temporalio/client';
import { Runtime, DefaultLogger, Worker } from '@temporalio/worker';
import { describe, before, after, it } from 'mocha';
import { currentWorkflowIdQuery, hasLockQuery, lockWorkflow, testLockWorkflow } from '../workflows';
import assert from 'assert';
import { v4 as uuidv4 } from 'uuid';

const taskQueue = 'test' + new Date().toLocaleDateString('en-US');

describe('lock workflow', function () {
  let runPromise: Promise<void>;
  let worker: Worker;
  let lockWorkflowHandle: WorkflowHandle<typeof lockWorkflow>;
  let env: TestWorkflowEnvironment;

  before(async function () {
    this.timeout(10000);
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.create();

    worker = await Worker.create({
      connection: env.nativeConnection,
      workflowsPath: require.resolve('../workflows'),
      taskQueue,
    });

    runPromise = worker.run();
  });

  beforeEach(async function () {
    lockWorkflowHandle = await env.workflowClient.start(lockWorkflow, {
      taskQueue,
      workflowId: 'lock-' + uuidv4(),
    });
  });

  after(async function () {
    worker.shutdown();
    await runPromise;

    await env.teardown();
  });

  it('handles locking and unlocking', async function () {
    const testWorkflowId = 'test-' + uuidv4();
    const testWorkflowHandle = await env.workflowClient.start(testLockWorkflow, {
      taskQueue,
      workflowId: testWorkflowId,
      args: [lockWorkflowHandle.workflowId],
    });

    let hasLock = await testWorkflowHandle.query(hasLockQuery);
    assert.ok(!hasLock);

    await env.sleep('100ms');

    hasLock = await testWorkflowHandle.query(hasLockQuery);
    assert.ok(hasLock);

    const currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
    assert.equal(currentWorkflowId, testWorkflowId);

    await testWorkflowHandle.result();

    hasLock = await testWorkflowHandle.query(hasLockQuery);
    assert.ok(!hasLock);
  });

  it('errors out if waiting for lock times out', async function () {
    const testWorkflowId1 = 'test-' + uuidv4();
    const testWorkflowHandle1 = await env.workflowClient.start(testLockWorkflow, {
      taskQueue,
      workflowId: testWorkflowId1,
      args: [lockWorkflowHandle.workflowId, 10000 /* 10s */],
    });

    let hasLock = await testWorkflowHandle1.query(hasLockQuery);
    assert.ok(!hasLock);

    await env.sleep('100ms');
    hasLock = await testWorkflowHandle1.query(hasLockQuery);
    assert.ok(hasLock);
    let currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
    assert.equal(currentWorkflowId, testWorkflowId1);

    const testWorkflowId2 = 'test-' + uuidv4();
    const testWorkflowHandle2 = await env.workflowClient.start(testLockWorkflow, {
      taskQueue,
      workflowId: testWorkflowId2,
      args: [lockWorkflowHandle.workflowId, 10000 /* 10s */],
    });

    await env.sleep('100ms');
    hasLock = await testWorkflowHandle1.query(hasLockQuery);
    assert.ok(hasLock);
    hasLock = await testWorkflowHandle2.query(hasLockQuery);
    assert.ok(!hasLock);
    currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
    assert.equal(currentWorkflowId, testWorkflowId1);

    await env.sleep('1300ms');
    hasLock = await testWorkflowHandle2.query(hasLockQuery);
    assert.ok(hasLock);
    currentWorkflowId = await lockWorkflowHandle.query(currentWorkflowIdQuery);
    assert.equal(currentWorkflowId, testWorkflowId2);
  });
});
