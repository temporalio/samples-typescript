import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { multiAgent } from '../workflows';

function text(s: string): LlmResponse {
  return { content: { role: 'model', parts: [{ text: s }] }, turnComplete: true };
}

// ADK JS's `transfer_to_agent` tool reads `args.agentName` (camelCase).
function transferTo(agentName: string): LlmResponse {
  return {
    content: { role: 'model', parts: [{ functionCall: { name: 'transfer_to_agent', args: { agentName } } }] },
    turnComplete: true,
  };
}

// Keyed by the asking agent rather than by call order, so an Activity retry re-serves the same turn.
function scriptedModelProvider(script: Record<string, LlmResponse>): (model: string) => BaseLlm {
  class ScriptedLlm extends BaseLlm {
    override async *generateContentAsync(
      llmRequest: LlmRequest,
      _stream = false,
      _abortSignal?: AbortSignal,
    ): AsyncGenerator<LlmResponse, void> {
      const asking = llmRequest.config?.labels?.['adk_agent_name'];
      const next = asking === undefined ? undefined : script[asking];
      if (next === undefined) {
        throw new Error(`scripted model has no turn for agent '${asking}'`);
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

  it('multiAgent: the relay reaches the writer, and only the writer produces the final text', async () => {
    const modelProvider = scriptedModelProvider({
      coordinator: transferTo('researcher'),
      researcher: transferTo('writer'),
      writer: text('snow on the mountain'),
    });

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
