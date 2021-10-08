import { WorkflowClient } from '@temporalio/client';
import { Worker, DefaultLogger } from '@temporalio/worker';
import { describe, before, after, afterEach, it } from 'mocha';
import assert from 'assert';
import axios from 'axios';
import sinon from 'sinon';

import * as activities from '../src/activities';
import { example } from '../src/workflows';

describe('example workflow', function () {
  let runPromise = null;
  let worker = null;
  let workflow = null;

  this.slow(1000);

  before(async function () {
    this.timeout(10 * 1000);
    worker = await Worker.create({
      workflowsPath: `${__dirname}/../src/workflows`,
      nodeModulesPath: `${__dirname}/../node_modules`,
      activities,
      taskQueue: 'test-activities',
      logger: new DefaultLogger('ERROR'),
    });

    runPromise = worker.run();
  });

  beforeEach(function () {
    const client = new WorkflowClient();

    workflow = client.createWorkflowHandle(example, { taskQueue: 'test-activities', workflowExecutionTimeout: 1000 });
  });

  after(async function () {
    worker.shutdown();
    await runPromise;
  });

  afterEach(() => {
    axios.get.restore && axios.get.restore();
  });

  it('returns correct result', async function () {
    const result = await workflow.execute();
    assert.equal(result, 'The answer is 42');
  });

  it('retries one failure', async function () {
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

  it('bubbles up activity errors', async function () {
    sinon.stub(axios, 'get').callsFake(() => Promise.reject(new Error('example error')));

    const err = await workflow.execute().then(
      () => null,
      (err) => err
    );
    assert.equal(err.name, 'WorkflowExecutionFailedError');
    assert.equal(err.cause.cause.message, 'example error');
  });
});
