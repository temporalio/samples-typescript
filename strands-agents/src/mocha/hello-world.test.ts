import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { helloWorld } from '../workflows';
import { StubModel, textTurn } from './stub-model';

describe('helloWorld workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('returns the model reply', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new StrandsPlugin({ models: { bedrock: () => new StubModel([textTurn('hello from stub')]) } })],
    });

    const result = await worker.runUntil(
      client.workflow.execute(helloWorld, {
        args: ['say hi'],
        workflowId: 'test-hello',
        taskQueue,
      })
    );
    assert.equal(result, 'hello from stub');
  });
});
