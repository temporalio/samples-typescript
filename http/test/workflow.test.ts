import { Connection, WorkflowClient } from '@temporalio/client';
import { Worker, DefaultLogger } from '@temporalio/worker';
import { describe, before, after, it } from 'mocha';
import { example } from '../lib/workflows';
import assert from 'assert';
import axios from 'axios';
import sinon from 'sinon';

describe('example workflow', function() {
  let worker = null;
  let runPromise = null;

  before(async function() {
    this.timeout(10000);
    worker = await Worker.create({
      workDir: `${__dirname}/../lib`,
      taskQueue: 'tutorial20210916',
      logger: new DefaultLogger('ERROR'),
    });

    runPromise = worker.run();
  });

  after(async function() {
    worker.shutdown();
    await runPromise;
  });

  it('returns correct result', async function() {
    const connection = new Connection();
    const client = new WorkflowClient(connection.service);

    const workflow = client.createWorkflowHandle(example, { taskQueue: 'tutorial20210916' });

    const result = await workflow.execute();
    assert.equal(result, 'The answer is 42');
  });

  it('handles errors', async function() {
    this.timeout(5000);
    const connection = new Connection();
    const client = new WorkflowClient(connection.service);

    const workflow = client.createWorkflowHandle(example, { taskQueue: 'tutorial20210916' });

    //sinon.stub(axios, 'get').callsFake(() => Promise.resolve({ data: { args: { answer: 42 } } }));
    sinon.stub(axios, 'get').callsFake(() => Promise.reject(new Error('42')));

    // This call hangs:
    const result = await workflow.execute();
  });
});