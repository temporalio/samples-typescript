import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { multiAgent } from '../workflows';

// A plain-text model turn.
function text(s: string): LlmResponse {
  return { content: { role: 'model', parts: [{ text: s }] }, turnComplete: true };
}

// A single function-call turn. ADK's JS `transfer_to_agent` tool reads
// `args.agentName` (camelCase), so delegation is driven via that key.
function toolCall(name: string, args: Record<string, unknown>): LlmResponse {
  return { content: { role: 'model', parts: [{ functionCall: { name, args } }] }, turnComplete: true };
}

// BaseLlm test double: each invokeModel Activity call shifts one response off the shared script, so a delegation chain sees successive scripted turns.
function scriptedModelProvider(script: LlmResponse[]): (model: string) => BaseLlm {
  class ScriptedLlm extends BaseLlm {
    override async *generateContentAsync(
      _llmRequest: LlmRequest,
      _stream = false,
      _abortSignal?: AbortSignal,
    ): AsyncGenerator<LlmResponse, void> {
      const next = script.shift();
      if (next === undefined) {
        throw new Error('scripted model script exhausted');
      }
      yield next;
    }

    override async connect(_llmRequest: LlmRequest): Promise<BaseLlmConnection> {
      throw new Error('ScriptedLlm does not support connect().');
    }
  }
  return (model: string) => new ScriptedLlm({ model });
}

describe('google-adk-agents/agent-patterns workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('multiAgent: coordinator delegates to researcher then writer', async () => {
    // Reaches the writer's text only if subAgents delegation actually fires: coordinator -> researcher -> writer -> final text.
    const modelProvider = scriptedModelProvider([
      toolCall('transfer_to_agent', { agentName: 'researcher' }),
      toolCall('transfer_to_agent', { agentName: 'writer' }),
      text('snow on the mountain'),
    ]);

    const taskQueue = 'test-google-adk-agent-patterns';
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ modelProvider })],
    });
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(multiAgent, {
        args: ['mountains'],
        workflowId: 'test-google-adk-agent-patterns-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'snow on the mountain');
  });
});
