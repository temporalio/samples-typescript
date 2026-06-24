import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import assert from 'assert';
import { FakeModelProvider, textResponse } from './fake-model';
import { customProvider } from '../workflows';

describe('openai-agents/model-providers custom-provider injection', function () {
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

  it('runs the agent through the injected custom provider', async () => {
    const taskQueue = 'test-custom-provider';
    const { worker, provider } = await makeWorker(taskQueue, [textResponse('Hello from the custom provider.')]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(customProvider, {
        args: ['Say hello.'],
        workflowId: 'test-custom-provider-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Hello from the custom provider.');
    assert.strictEqual(provider.model.requests.length, 1, 'the injected provider should handle the model call');
  });

  it('resolves the run model name through the injected provider', async () => {
    const taskQueue = 'test-custom-provider-model';
    const { worker, provider } = await makeWorker(taskQueue, [textResponse('Done.')]);
    await worker.runUntil(
      testEnv.client.workflow.execute(customProvider, {
        args: ['Say hello.', 'my-custom-model'],
        workflowId: 'test-custom-provider-model-' + Date.now(),
        taskQueue,
      }),
    );
    assert.deepStrictEqual(provider.requestedModelNames, ['my-custom-model']);
  });
});
