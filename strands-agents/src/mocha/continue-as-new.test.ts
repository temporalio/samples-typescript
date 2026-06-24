import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { chatEnd, chatTurn, chatWorkflow } from '../workflows';
import { StubModel, textTurn } from './stub-model';

describe('chatWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('runs multiple turns and exits on endChat', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new StrandsPlugin({
          models: {
            bedrock: () => new StubModel([textTurn('one'), textTurn('two')]),
          },
        }),
      ],
    });

    await worker.runUntil(async () => {
      const handle = await client.workflow.start(chatWorkflow, {
        workflowId: 'test-chat',
        taskQueue,
      });

      const replies: string[] = [];
      replies.push(await handle.executeUpdate(chatTurn, { args: ['first'] }));
      replies.push(await handle.executeUpdate(chatTurn, { args: ['second'] }));

      await handle.signal(chatEnd);
      await handle.result();

      assert.deepEqual(replies, ['one', 'two']);
    });
  });
});
