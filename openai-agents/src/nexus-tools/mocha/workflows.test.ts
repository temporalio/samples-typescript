import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import assert from 'assert';
import { FakeModelProvider, textResponse, toolCallResponse } from './fake-model';
import { nexusToolWorkflow, WEATHER_ENDPOINT } from '../workflows';
import { weatherServiceHandler } from '../handler';

describe('openai-agents/nexus-tools workflow', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('agent calls a Nexus operation as a tool and the result reaches the model', async () => {
    const taskQueue = 'test-nexus-tools';
    await testEnv.createNexusEndpoint(WEATHER_ENDPOINT, taskQueue);

    const provider = new FakeModelProvider([
      toolCallResponse('getWeather', { city: 'Tokyo' }),
      textResponse('It is 22C and sunny in Tokyo.'),
    ]);

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      nexusServices: [weatherServiceHandler],
      plugins: [new OpenAIAgentsPlugin({ modelProvider: provider })],
      bundlerOptions: {
        webpackConfigHook: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            conditionNames: ['require', 'browser', 'default'],
          },
        }),
      },
    });

    const result = await worker.runUntil(
      testEnv.client.workflow.execute(nexusToolWorkflow, {
        args: ['What is the weather in Tokyo?'],
        workflowId: 'test-nexus-tools-' + Date.now(),
        taskQueue,
      }),
    );

    assert.strictEqual(result, 'It is 22C and sunny in Tokyo.');

    // The Nexus operation result is sent back to the model on the second turn as a
    // function_call_result item, proving the operation ran and its output reached the model.
    const toolResults = provider.model.requests
      .flatMap((req) => (Array.isArray(req.input) ? req.input : []))
      .filter((item) => item.type === 'function_call_result' && item.name === 'getWeather');
    assert.strictEqual(toolResults.length, 1, 'getWeather op result should reach the model exactly once');

    const output = (toolResults[0] as { output: { type: string; text: string } }).output;
    const opResult = JSON.parse(output.text);
    assert.strictEqual(opResult.city, 'Tokyo');
    assert.strictEqual(opResult.temperatureC, 22);
    assert.strictEqual(opResult.conditions, 'Sunny');
  });
});
