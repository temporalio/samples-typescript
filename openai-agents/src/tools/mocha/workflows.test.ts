import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import assert from 'assert';
import { FakeModelProvider, textResponse } from './fake-model';
import { webSearch, imageGeneration, codeInterpreter } from '../workflows';

describe('openai-agents/tools hosted-tool scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  async function makeWorker(taskQueue: string, responses: ReturnType<typeof textResponse>[]) {
    const provider = new FakeModelProvider(responses);
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
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
    return { worker, provider };
  }

  it('webSearch: agent with webSearchTool runs and returns model output', async () => {
    const taskQueue = 'test-web-search';
    const { worker, provider } = await makeWorker(taskQueue, [
      textResponse('Durable execution keeps state on failure.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(webSearch, {
        args: ['What is durable execution?'],
        workflowId: 'test-web-search-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Durable execution keeps state on failure.');

    const tools = provider.model.requests[0]?.tools ?? [];
    assert.ok(
      tools.some((t) => t.type === 'hosted_tool' && t.name === 'web_search'),
      'web_search hosted tool should be sent to the model',
    );
  });

  it('imageGeneration: agent with imageGenerationTool runs and returns model output', async () => {
    const taskQueue = 'test-image-generation';
    const { worker, provider } = await makeWorker(taskQueue, [textResponse('Here is your generated image.')]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(imageGeneration, {
        args: ['Generate an image of a robot.'],
        workflowId: 'test-image-generation-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Here is your generated image.');

    const tools = provider.model.requests[0]?.tools ?? [];
    assert.ok(
      tools.some((t) => t.type === 'hosted_tool' && t.name === 'image_generation'),
      'image_generation hosted tool should be sent to the model',
    );
  });

  it('codeInterpreter: agent with codeInterpreterTool runs and returns model output', async () => {
    const taskQueue = 'test-code-interpreter';
    const { worker, provider } = await makeWorker(taskQueue, [textResponse('The answer is 6765.')]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(codeInterpreter, {
        args: ['What is the 20th Fibonacci number?'],
        workflowId: 'test-code-interpreter-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'The answer is 6765.');

    const tools = provider.model.requests[0]?.tools ?? [];
    assert.ok(
      tools.some((t) => t.type === 'hosted_tool' && t.name === 'code_interpreter'),
      'code_interpreter hosted tool should be sent to the model',
    );
  });
});
