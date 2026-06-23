import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import * as activities from '../activities';
import assert from 'assert';
import { FakeModelProvider, textResponse, toolCallResponse } from './fake-model';
import {
  helloWorld,
  tools,
  inlineTool,
  localActivityTool,
  agentContext,
  structuredOutput,
  modelOverride,
  dynamicInstructions,
} from '../workflows';

describe('openai-agents/basic workflow scenarios', function () {
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
      activities,
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

  it('helloWorld: returns model text output', async () => {
    const taskQueue = 'test-hello-world';
    const { worker } = await makeWorker(taskQueue, [textResponse('Hello from the fake model!')]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(helloWorld, {
        args: ['Say hello.'],
        workflowId: 'test-hello-world-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Hello from the fake model!');
  });

  it('tools: activityAsTool round-trip', async () => {
    const taskQueue = 'test-tools';
    const { worker } = await makeWorker(taskQueue, [
      toolCallResponse('getWeather', { city: 'Tokyo' }),
      textResponse('It is sunny in Tokyo.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(tools, {
        args: ['What is the weather in Tokyo?'],
        workflowId: 'test-tools-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'It is sunny in Tokyo.');
  });

  it('inlineTool: inline tool round-trip', async () => {
    const taskQueue = 'test-inline-tool';
    const { worker } = await makeWorker(taskQueue, [
      toolCallResponse('add', { a: 3, b: 4 }),
      textResponse('3 plus 4 equals 7.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(inlineTool, {
        args: ['What is 3 + 4?'],
        workflowId: 'test-inline-tool-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, '3 plus 4 equals 7.');
  });

  it('localActivityTool: local activity tool round-trip', async () => {
    const taskQueue = 'test-local-activity-tool';
    const { worker } = await makeWorker(taskQueue, [
      toolCallResponse('getHeadlines', { topic: 'AI' }),
      textResponse('Here are the latest AI headlines.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(localActivityTool, {
        args: ['Get headlines about AI.'],
        workflowId: 'test-local-activity-tool-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Here are the latest AI headlines.');
  });

  it('agentContext: tool reads runContext.context and value reaches the model', async () => {
    const taskQueue = 'test-agent-context';
    const { worker, provider } = await makeWorker(taskQueue, [
      toolCallResponse('whoAmI', {}),
      textResponse('You are user-42.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(agentContext, {
        args: ['Who am I?'],
        workflowId: 'test-agent-context-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'You are user-42.');

    // The whoAmI tool returns runContext.context.userId; its result is sent back
    // to the model on the second turn as a function_call_result item, proving the
    // context-derived value flowed through the tool to the model.
    const toolResults = provider.model.requests
      .flatMap((req) => (Array.isArray(req.input) ? req.input : []))
      .filter((item) => item.type === 'function_call_result' && item.name === 'whoAmI');
    assert.strictEqual(toolResults.length, 1, 'whoAmI tool result should reach the model exactly once');
    assert.deepStrictEqual((toolResults[0] as { output: unknown }).output, { type: 'text', text: 'user-42' });
  });

  it('structuredOutput: returns typed object as JSON', async () => {
    const taskQueue = 'test-structured-output';
    const payload = { title: 'Temporal', summary: 'A durable execution platform.', keywords: ['temporal', 'workflow'] };
    const { worker } = await makeWorker(taskQueue, [textResponse(JSON.stringify(payload))]);
    const raw = await worker.runUntil(
      testEnv.client.workflow.execute(structuredOutput, {
        args: ['Temporal is a durable execution platform for building reliable distributed systems.'],
        workflowId: 'test-structured-output-' + Date.now(),
        taskQueue,
      }),
    );
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.title, 'Temporal');
    assert.ok(typeof parsed.summary === 'string');
    assert.ok(Array.isArray(parsed.keywords));
  });

  it('modelOverride: runConfig.model is the model resolved by the provider', async () => {
    const taskQueue = 'test-model-override';
    const { worker, provider } = await makeWorker(taskQueue, [textResponse('Temporal is a workflow engine.')]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(modelOverride, {
        args: ['Briefly explain what Temporal is.'],
        workflowId: 'test-model-override-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Temporal is a workflow engine.');
    assert.deepStrictEqual(provider.requestedModelNames, ['gpt-4o-mini']);
  });

  it('dynamicInstructions: context-derived instruction reaches the model', async () => {
    const taskQueue = 'test-dynamic-instructions';
    const { worker, provider } = await makeWorker(taskQueue, [textResponse('Hello back!')]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(dynamicInstructions, {
        args: ['Hello!'],
        workflowId: 'test-dynamic-instructions-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Hello back!');

    // The instructions function computes the system prompt from runContext.context
    // ({ userName: 'Ada', style: 'concise' }); assert that resolved prompt reached the model.
    const systemInstructions = provider.model.requests[0]?.systemInstructions;
    assert.strictEqual(
      systemInstructions,
      'You are a helpful assistant. Address the user as Ada and respond in a concise style.',
    );
  });
});
