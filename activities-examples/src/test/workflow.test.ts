import { Connection, WorkflowClient, WorkflowHandle } from '@temporalio/client';
import { Core, Worker, DefaultLogger } from '@temporalio/worker';
import { describe, before, after, afterEach, it } from 'mocha';
import assert from 'assert';
import axios from 'axios';
import sinon from 'sinon';
import { httpWorkflow } from '../workflows';
import * as activities from '../activities';

describe('example workflow', function () {
  let shutdown: () => Promise<void>;
  let workflow: WorkflowHandle<typeof httpWorkflow>;

  before(async function () {
    this.timeout(10000);
    // Filter INFO log messages for clearer test output
    await Core.install({ logger: new DefaultLogger('WARN') });
    const worker = await Worker.create({
      taskQueue: 'testhttp',
      workflowsPath: require.resolve('../workflows'),
      activities,
    });

    const runPromise = worker.run();
    shutdown = async () => {
      worker.shutdown();
      await runPromise;
    };
  });

  beforeEach(() => {
    const connection = new Connection();
    const client = new WorkflowClient(connection.service);

    workflow = client.createWorkflowHandle(httpWorkflow, { taskQueue: 'testhttp' });
  });

  after(async () => {
    await shutdown();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns correct result', async () => {
    const result = await workflow.execute();
    assert.equal(result, 'The answer is 42');
  });

  it('retries one failure', async () => {
    // Make the first request fail, but subsequent requests succeed
    let numCalls = 0;
    sinon.stub(axios, 'get').callsFake(() => {
      if (numCalls++ === 0) {
        return Promise.reject(new Error('first error'));
      }
      return Promise.resolve({ data: { args: { answer: '88' } } });
    });

    const result = await workflow.execute();
    assert.equal(result, 'The answer is 88');
  });

  it('bubbles up activity errors', async () => {
    sinon.stub(axios, 'get').callsFake(() => Promise.reject(new Error('example error')));

    await assert.rejects(
      () => workflow.execute(),
      (err: any) => err.name === 'WorkflowExecutionFailedError' && err.cause.cause.message === 'example error'
    );
  });
});
