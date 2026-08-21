import type { LlmRequest, LlmResponse } from '@google/adk';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { FakeLlm } from '@temporalio/google-adk-agents/testing';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { offlineModelProvider } from '../offline-model';
import { agentChat, getChatState, sendMessage } from '../workflows';

describe('google-adk-agents/agent-chat', function () {
  this.timeout(30_000);
  let testEnv: TestWorkflowEnvironment;
  before(async () => (testEnv = await TestWorkflowEnvironment.createLocal()));
  after(async () => testEnv?.teardown());

  it('accepts multiple turns and continues as new with conversation state', async () => {
    const requests: LlmRequest[] = [];
    const taskQueue = `test-google-adk-agent-chat-${Date.now()}`;
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ modelProvider: offlineModelProvider((request) => requests.push(request)) })],
    });
    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(agentChat, {
        args: [[], 0, 1, 2],
        workflowId: taskQueue,
        taskQueue,
      });
      assert.strictEqual(await handle.executeUpdate(sendMessage, { args: ['My name is Ada.'] }), 'Hello, Ada.');
      assert.strictEqual(await handle.executeUpdate(sendMessage, { args: ['What is my name?'] }), 'Your name is Ada.');
      await testEnv.sleep(100);
      const state = await handle.query(getChatState);
      assert.deepStrictEqual(state.messages, [
        { role: 'user', text: 'My name is Ada.' },
        { role: 'assistant', text: 'Hello, Ada.' },
        { role: 'user', text: 'What is my name?' },
        { role: 'assistant', text: 'Your name is Ada.' },
      ]);
      assert.strictEqual(requests.length, 2);
      const requestText = (requests[1].contents ?? [])
        .flatMap((content) => content.parts ?? [])
        .map((part) => part.text ?? '')
        .join('\n');
      assert.ok(requestText.includes('user: My name is Ada.\nassistant: Hello, Ada.\nuser: What is my name?'));
      assert.ok(state.runs >= 2);
      await handle.terminate();
    });
  });

  it('serializes concurrent updates with shared conversation context', async () => {
    const requests: LlmRequest[] = [];
    class InspectingLlm extends FakeLlm {
      override async *generateContentAsync(request: LlmRequest): AsyncGenerator<LlmResponse, void> {
        requests.push(request);
        yield {
          content: { role: 'model', parts: [{ text: requests.length === 1 ? 'First answer.' : 'Second answer.' }] },
          turnComplete: true,
        };
      }
    }
    const taskQueue = `test-google-adk-agent-chat-concurrent-${Date.now()}`;
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ modelProvider: () => new InspectingLlm() })],
    });
    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(agentChat, {
        args: [[], 0, 1, 3],
        workflowId: taskQueue,
        taskQueue,
      });
      const first = handle.executeUpdate(sendMessage, { args: ['First prompt.'] });
      const second = handle.executeUpdate(sendMessage, { args: ['Second prompt.'] });
      assert.deepStrictEqual((await Promise.all([first, second])).sort(), ['First answer.', 'Second answer.']);
      assert.strictEqual(requests.length, 2);
      const firstPrompt = JSON.stringify(requests[0]).includes('First prompt.') ? 'First prompt.' : 'Second prompt.';
      const secondPrompt = firstPrompt === 'First prompt.' ? 'Second prompt.' : 'First prompt.';
      assert.ok(JSON.stringify(requests[1]).includes(firstPrompt));
      assert.match(JSON.stringify(requests[1]), /First answer\./);
      const state = await handle.query(getChatState);
      assert.deepStrictEqual(state.messages, [
        { role: 'user', text: firstPrompt },
        { role: 'assistant', text: 'First answer.' },
        { role: 'user', text: secondPrompt },
        { role: 'assistant', text: 'Second answer.' },
      ]);
      await handle.terminate();
    });
  });
});
