import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import * as activities from '../activities';
import assert from 'assert';
import { FakeModelProvider, textResponse } from './fake-model';
import { multiTurnChat, carryoverChat } from '../workflows';

describe('openai-agents/sessions workflow scenarios', function () {
  this.timeout(60_000);

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

  it('multiTurnChat: second turn input includes the first turn history', async () => {
    const taskQueue = 'test-multi-turn-chat';
    const firstPrompt = 'What is the capital of France?';
    const firstReply = 'The capital of France is Paris.';
    const secondPrompt = 'What is it known for?';
    const secondReply = 'Paris is known for the Eiffel Tower.';

    const { worker, provider } = await makeWorker(taskQueue, [textResponse(firstReply), textResponse(secondReply)]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(multiTurnChat, {
        args: [[firstPrompt, secondPrompt]],
        workflowId: 'test-multi-turn-chat-' + Date.now(),
        taskQueue,
      }),
    );

    assert.deepStrictEqual(result, [firstReply, secondReply]);
    assert.strictEqual(provider.model.requests.length, 2, 'should have made one model call per prompt');

    const turn1Input = provider.model.requests[0]!.input;
    assert.ok(
      turn1Input === firstPrompt || (Array.isArray(turn1Input) && JSON.stringify(turn1Input).includes(firstPrompt)),
      'turn-1 input should contain the first prompt',
    );

    const turn2Input = provider.model.requests[1]!.input;
    assert.ok(Array.isArray(turn2Input), 'turn-2 input should be an array because the session prepends history items');

    const turn2Text = JSON.stringify(turn2Input);
    assert.ok(
      turn2Text.includes(firstPrompt),
      'turn-2 input should include the turn-1 user prompt from session history',
    );
    assert.ok(
      turn2Text.includes(firstReply),
      'turn-2 input should include the turn-1 assistant reply from session history',
    );

    const userItems = (turn2Input as unknown[]).filter(
      (item): item is { role: string; content: unknown } =>
        typeof item === 'object' && item !== null && 'role' in item && (item as { role: string }).role === 'user',
    );
    const assistantItems = (turn2Input as unknown[]).filter(
      (item): item is { role: string; content: unknown } =>
        typeof item === 'object' && item !== null && 'role' in item && (item as { role: string }).role === 'assistant',
    );

    assert.ok(userItems.length >= 2, 'turn-2 input should have at least two user items: history + new prompt');
    assert.ok(assistantItems.length >= 1, 'turn-2 input should have at least one assistant item from session history');

    const firstUserContent = userItems[0]!.content;
    const firstUserText = typeof firstUserContent === 'string' ? firstUserContent : JSON.stringify(firstUserContent);
    assert.ok(
      firstUserText.includes(firstPrompt),
      'first user item in turn-2 should be the turn-1 prompt (replayed from session)',
    );

    const assistantContent = assistantItems[0]!.content;
    const assistantText = typeof assistantContent === 'string' ? assistantContent : JSON.stringify(assistantContent);
    assert.ok(
      assistantText.includes(firstReply),
      'assistant item in turn-2 should contain the turn-1 reply (replayed from session)',
    );

    const lastUserContent = userItems[userItems.length - 1]!.content;
    const lastUserText = typeof lastUserContent === 'string' ? lastUserContent : JSON.stringify(lastUserContent);
    assert.ok(lastUserText.includes(secondPrompt), 'last user item in turn-2 should be the new second prompt');
  });

  it('carryoverChat: session history survives a continue-as-new boundary', async () => {
    const taskQueue = 'test-carryover-chat';
    const firstPrompt = 'What is the capital of France?';
    const firstReply = 'The capital of France is Paris.';
    const secondPrompt = 'What is it known for?';
    const secondReply = 'Paris is known for the Eiffel Tower.';
    const thirdPrompt = 'What is the population?';
    const thirdReply = 'The population is about two million.';

    const { worker, provider } = await makeWorker(taskQueue, [
      textResponse(firstReply),
      textResponse(secondReply),
      textResponse(thirdReply),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(carryoverChat, {
        args: [{ prompts: [firstPrompt, secondPrompt, thirdPrompt] }],
        workflowId: 'test-carryover-chat-' + Date.now(),
        taskQueue,
      }),
    );

    assert.deepStrictEqual(result, [firstReply, secondReply, thirdReply]);
    assert.strictEqual(
      provider.model.requests.length,
      3,
      'should have made one model call per prompt across continue-as-new runs',
    );

    const thirdTurnInput = provider.model.requests[2]!.input;
    const thirdTurnText = Array.isArray(thirdTurnInput) ? JSON.stringify(thirdTurnInput) : String(thirdTurnInput);
    assert.ok(
      thirdTurnText.includes(firstPrompt),
      'third-run model input should include the first-run user prompt, proving history crossed the continue-as-new boundary',
    );
    assert.ok(
      thirdTurnText.includes(firstReply),
      'third-run model input should include the first-run assistant reply, proving history crossed the continue-as-new boundary',
    );
  });
});
