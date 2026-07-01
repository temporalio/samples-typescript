import type { LlmResponse } from '@google/adk';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { fakeModelProvider } from '@temporalio/google-adk-agents/testing';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { streamingModelCall } from '../workflows';

const chunks: LlmResponse[] = [
  { content: { role: 'model', parts: [{ text: 'Hello ' }] }, partial: true },
  { content: { role: 'model', parts: [{ text: 'streaming ' }] }, partial: true },
  { content: { role: 'model', parts: [{ text: 'world' }] }, turnComplete: true },
];

describe('google-adk-agents/streaming workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('streamingModelCall: returns the full transcript and chunk count', async () => {
    const taskQueue = 'test-google-adk-streaming';
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ modelProvider: fakeModelProvider(chunks) })],
    });
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(streamingModelCall, {
        args: ['stream please'],
        workflowId: 'test-google-adk-streaming-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result.chunks, 3);
    assert.strictEqual(result.text, 'Hello streaming world');
  });
});
