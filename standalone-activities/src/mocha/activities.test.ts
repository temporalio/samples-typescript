import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from '../activities';
import assert from 'assert';
import { ActivityExecutionFailedError } from '@temporalio/client';

const taskQueue = 'test';

async function createWorker(connection: NativeConnection) {
  return await Worker.create({
    connection,
    taskQueue,
    activities,
  });
}

describe('Example workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the Activity', async () => {
    const { client, nativeConnection } = testEnv;

    const worker = await createWorker(nativeConnection);

    const result = await worker.runUntil(
      client.activity.typed<typeof activities>().execute('greet', {
        id: 'test',
        taskQueue,
        args: ['Temporal'],
      }),
    );
    assert.equal(result, 'Hello, Temporal!');
  });

  it('throws when name is not string', async () => {
    const { client, nativeConnection } = testEnv;

    const worker = await createWorker(nativeConnection);
    const runPromise = worker.run();

    try {
      await assert.rejects(
        client.activity.execute('greet', {
          id: 'test',
          taskQueue,
          args: [1],
        }),
        (err) => {
          assert(err instanceof ActivityExecutionFailedError);
          assert.equal(err.cause?.message, 'name must be a string');
        },
      );
    } finally {
      worker.shutdown();
      await runPromise;
    }
  });
});
