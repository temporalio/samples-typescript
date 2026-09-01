import type { LlmResponse } from '@google/adk';
import { Resource } from '@opentelemetry/resources';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { fakeModelProvider } from '@temporalio/google-adk-agents/testing';
import { OpenTelemetryPlugin } from '@temporalio/interceptors-opentelemetry';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { AdkUsageSpanProcessor, type ModelCall } from '../adk-usage-span-processor';
import { observedAgent } from '../workflows';

const prompts = ['Write a haiku about durable execution.', 'Write a haiku about workflow replay.'];

const responses: LlmResponse[] = [
  {
    content: { role: 'model', parts: [{ text: 'snow on the mountain' }] },
    usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 7 },
    turnComplete: true,
  },
];

describe('google-adk-agents/observability workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('observedAgent: composing OpenTelemetryPlugin exports the ADK spans and their token usage', async () => {
    const taskQueue = 'test-google-adk-observability';
    const modelCalls: ModelCall[] = [];
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new OpenTelemetryPlugin({
          resource: new Resource({ 'service.name': 'test-google-adk-observability' }),
          spanProcessor: new AdkUsageSpanProcessor((call) => modelCalls.push(call)),
        }),
        new GoogleAdkPlugin({ modelProvider: fakeModelProvider(responses) }),
      ],
    });
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(observedAgent, {
        args: [prompts],
        workflowId: `${taskQueue}-${Date.now()}`,
        taskQueue,
      }),
    );
    assert.deepStrictEqual(result, ['snow on the mountain', 'snow on the mountain']);

    assert.ok(
      modelCalls.length >= prompts.length,
      `expected at least ${prompts.length} call_llm spans, got ${modelCalls.length}`,
    );
    for (const call of modelCalls) {
      assert.deepStrictEqual(
        { model: call.model, inputTokens: call.inputTokens, outputTokens: call.outputTokens },
        { model: 'gemini-2.5-flash', inputTokens: 11, outputTokens: 7 },
      );
      assert.ok(call.durationMs > 0, 'each call_llm span should have a duration');
    }
  });
});
