import { ActivityFailure, ApplicationFailure, WorkflowFailedError } from '@temporalio/client';
import { Runtime, DefaultLogger, Worker, WorkerOptions } from '@temporalio/worker';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import sinon from 'sinon';
import { v4 as uuid } from 'uuid';
import { httpWorkflow } from '../workflows';
import * as activities from '../activities';
import { WorkflowCoverage } from '@temporalio/nyc-test-coverage';

const workflowCoverage = new WorkflowCoverage();

describe('example workflow', async function () {
  this.slow(10_000);
  this.timeout(20_000);

  let env: TestWorkflowEnvironment;

  before(async function () {
    // Filter INFO log messages for clearer test output
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await env.teardown();
    workflowCoverage.mergeIntoGlobalCoverage();
  });

  async function executeWithWorker(workerOptions: Pick<WorkerOptions, 'activities'>) {
    const taskQueue = `test-activities-${uuid()}`;

    const worker = await Worker.create(
      workflowCoverage.augmentWorkerOptions({
        ...workerOptions,
        activities: { ...activities, ...workerOptions.activities },
        connection: env.nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('../workflows'),
      }),
    );
    return await worker.runUntil(async () =>
      env.client.workflow.execute(httpWorkflow, {
        taskQueue,
        workflowExecutionTimeout: 10_000,
        // Use random ID because ID is meaningless for this test
        workflowId: `test-${uuid()}`,
      }),
    );
  }

  it('returns correct result', async () => {
    const result = await executeWithWorker({});
    assert.equal(result, 'The answer is 42');
  });

  it('retries one failure', async () => {
    const fakeMakeHTTPRequest = sinon.stub();
    fakeMakeHTTPRequest.onFirstCall().rejects(new Error('example error'));
    fakeMakeHTTPRequest.resolves('88');

    const result = await executeWithWorker({ activities: { makeHTTPRequest: fakeMakeHTTPRequest } });

    assert.equal(result, 'The answer is 88');
    assert.equal(fakeMakeHTTPRequest.callCount, 2);
  });

  it('bubbles up activity errors', async () => {
    const fakeMakeHTTPRequest = sinon.stub().rejects(new Error('example error'));

    await assert.rejects(
      executeWithWorker({ activities: { makeHTTPRequest: fakeMakeHTTPRequest } }),
      (err: unknown) =>
        err instanceof WorkflowFailedError &&
        err.cause instanceof ActivityFailure &&
        err.cause.cause instanceof ApplicationFailure &&
        err.cause.cause.message === 'example error',
    );
  });
});
