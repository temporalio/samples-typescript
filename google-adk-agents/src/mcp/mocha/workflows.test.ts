import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { Type } from '@google/genai';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { mockMCPToolset, type MockMCPToolDefinition } from '@temporalio/google-adk-agents/testing';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { filesystemAgent } from '../workflows';

const readFileDef: MockMCPToolDefinition = {
  declaration: {
    name: 'read_file',
    description: 'Read a file.',
    parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING } }, required: ['path'] },
  },
  handler: (args) => ({ contents: `contents of ${String(args.path)}` }),
};

function readFileModelProvider(): (model: string) => BaseLlm {
  class ReadFileLlm extends BaseLlm {
    override async *generateContentAsync(
      llmRequest: LlmRequest,
      _stream = false,
      _abortSignal?: AbortSignal,
    ): AsyncGenerator<LlmResponse, void> {
      const toolResponse = (llmRequest.contents ?? [])
        .flatMap((content) => content.parts ?? [])
        .find((part) => part.functionResponse?.name === 'read_file')?.functionResponse?.response;
      if (toolResponse === undefined) {
        yield {
          content: {
            role: 'model',
            parts: [{ functionCall: { name: 'read_file', args: { path: 'hello.txt' } } }],
          },
          turnComplete: true,
        };
        return;
      }
      const text = String((toolResponse as { contents?: unknown }).contents);
      yield { content: { role: 'model', parts: [{ text }] }, turnComplete: true };
    }

    override async connect(_llmRequest: LlmRequest): Promise<BaseLlmConnection> {
      throw new Error('ReadFileLlm does not support connect().');
    }
  }
  return (model: string) => new ReadFileLlm({ model });
}

describe('google-adk-agents/mcp workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('filesystemAgent: the model calls an MCP tool and its result reaches the next turn', async () => {
    const taskQueue = 'test-google-adk-mcp-agent';
    const workflowId = taskQueue + '-' + Date.now();
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new GoogleAdkPlugin({
          modelProvider: readFileModelProvider(),
          mcpToolsets: { filesystem: mockMCPToolset([readFileDef]) },
        }),
      ],
    });
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(filesystemAgent, {
        args: ['Summarize hello.txt.'],
        workflowId,
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'contents of hello.txt');

    const { events } = await testEnv.client.workflow.getHandle(workflowId).fetchHistory();
    const scheduled = (events ?? []).map((e) => e.activityTaskScheduledEventAttributes?.activityType?.name);
    assert.strictEqual(scheduled.filter((name) => name === 'filesystem-callTool').length, 1);
  });
});
