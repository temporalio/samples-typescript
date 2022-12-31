import { TestWorkflowEnvironment } from '@temporalio/testing';
import { WorkflowHandle, WorkflowFailedError } from '@temporalio/client';
import { Runtime, DefaultLogger, Worker } from '@temporalio/worker';
import { describe, before, after, it } from 'mocha';
import { lockRequestSignal, lockAcquiredSignal, lockWorkflow } from './workflows';
import assert from 'assert';
import { v4 as uuidv4 } from 'uuid';

const taskQueue = 'test' + new Date().toLocaleDateString('en-US');

describe('lock workflow', function () {
  let runPromise: Promise<void>;
  let worker: Worker;
  let handle: WorkflowHandle<typeof lockWorkflow>;
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
    const client = env.workflowClient;

    handle = await client.start(lockWorkflow, {
      taskQueue,
      workflowId: 'cart-test-' + uuidv4(),
    });
  });

  after(async function () {
    worker.shutdown();
    await runPromise;

    await env.nativeConnection.close();
    await env.teardown();
  });
});
