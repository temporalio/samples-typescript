import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { hitlApproveSignal, humanInTheLoop } from '../workflows';
import { StubModel, textTurn, toolCallTurn } from './stub-model';

describe('humanInTheLoop workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('pauses on BeforeToolCallEvent.interrupt and resumes after a signal', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new StrandsPlugin({
          models: {
            bedrock: () =>
              new StubModel([
                toolCallTurn('deleteFile', 'call_1', { path: '/tmp/x' }),
                textTurn('deleted /tmp/x'),
              ]),
          },
        }),
      ],
    });

    const result = await worker.runUntil(async () => {
      const handle = await client.workflow.start(humanInTheLoop, {
        args: ['delete /tmp/x'],
        workflowId: 'test-hitl',
        taskQueue,
      });
      await handle.signal(hitlApproveSignal, 'approve');
      return handle.result();
    });
    assert.equal(result, 'deleted /tmp/x');
  });
});
