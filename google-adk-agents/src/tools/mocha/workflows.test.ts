import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { ApplicationFailure } from '@temporalio/common';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import * as activities from '../activities';
import { weatherAgent } from '../workflows';

// A fresh model instance per Activity invocation, so the turn has to come from the request.
function weatherModelProvider(): (model: string) => BaseLlm {
  class WeatherLlm extends BaseLlm {
    override async *generateContentAsync(
      llmRequest: LlmRequest,
      _stream = false,
      _abortSignal?: AbortSignal,
    ): AsyncGenerator<LlmResponse, void> {
      const toolResponse = (llmRequest.contents ?? [])
        .flatMap((content) => content.parts ?? [])
        .find((part) => part.functionResponse?.name === 'getWeather')?.functionResponse?.response as
        | { result?: unknown; error?: unknown }
        | undefined;
      if (toolResponse === undefined) {
        yield {
          content: { role: 'model', parts: [{ functionCall: { name: 'getWeather', args: { city: 'Tokyo' } } }] },
          turnComplete: true,
        };
        return;
      }
      const text =
        toolResponse.error === undefined
          ? String(toolResponse.result)
          : `I could not look up the weather: ${String(toolResponse.error)}`;
      yield { content: { role: 'model', parts: [{ text }] }, turnComplete: true };
    }

    override async connect(_llmRequest: LlmRequest): Promise<BaseLlmConnection> {
      throw new Error('WeatherLlm does not support connect().');
    }
  }
  return (model: string) => new WeatherLlm({ model });
}

describe('google-adk-agents/tools workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  async function runWeatherAgent(taskQueue: string, workflowId: string, workerActivities: typeof activities) {
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: workerActivities,
      plugins: [new GoogleAdkPlugin({ modelProvider: weatherModelProvider() })],
    });
    return worker.runUntil(
      testEnv.client.workflow.execute(weatherAgent, {
        args: ['What is the weather in Tokyo?'],
        workflowId,
        taskQueue,
      }),
    );
  }

  it('weatherAgent: the model calls the tool, the Activity runs, and its result reaches the next turn', async () => {
    const taskQueue = 'test-google-adk-tools-agent';
    const workflowId = taskQueue + '-' + Date.now();
    const result = await runWeatherAgent(taskQueue, workflowId, activities);
    assert.strictEqual(result, 'The weather in Tokyo is warm and sunny, 17 degrees.');

    const { events } = await testEnv.client.workflow.getHandle(workflowId).fetchHistory();
    const scheduled = (events ?? []).map((e) => e.activityTaskScheduledEventAttributes?.activityType?.name);
    assert.strictEqual(scheduled.filter((name) => name === 'getWeather').length, 1);
    assert.strictEqual(scheduled.filter((name) => name === 'adk-invokeModel').length, 2);
  });

  it('weatherAgent: a failed tool Activity reaches the model as the tool response, and the agent answers from it', async () => {
    const taskQueue = 'test-google-adk-tools-agent-failure';
    const result = await runWeatherAgent(taskQueue, taskQueue + '-' + Date.now(), {
      getWeather: async () => {
        throw ApplicationFailure.nonRetryable('the weather service is down');
      },
    });
    assert.strictEqual(result, 'I could not look up the weather: Activity task failed');
  });
});
