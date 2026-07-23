import assert from 'assert';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { McpClient } from '@strands-agents/sdk';
import type { JSONValue, Tool } from '@strands-agents/sdk';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { mcpWorkflow } from '../workflows';
import { StubModel, textTurn, toolCallTurn } from './stub-model';

const STUB_TRANSPORT: Transport = {
  async start() {},
  async send() {},
  async close() {},
};

class StubMcpClient extends McpClient {
  constructor(private readonly toolList: Array<{ name: string; description: string; inputSchema: unknown }>) {
    super({ transport: STUB_TRANSPORT });
  }

  override async connect(): Promise<void> {}
  override async disconnect(): Promise<void> {}
  override async listTools(): Promise<never> {
    return this.toolList.map(
      (t) =>
        ({
          name: t.name,
          description: t.description,
          toolSpec: { name: t.name, description: t.description, inputSchema: t.inputSchema },
        }) as unknown as Tool
    ) as never;
  }
  override async callTool(tool: { name: string }, args: JSONValue): Promise<JSONValue> {
    return {
      content: [{ type: 'text', text: `mcp:${tool.name}(${JSON.stringify(args)})` }],
      isError: false,
    } as never;
  }
}

describe('mcpWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('discovers and calls MCP tools through per-server activities', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const echoFactory = (): McpClient =>
      new StubMcpClient([
        {
          name: 'echo',
          description: 'Echo the input',
          inputSchema: { type: 'object', properties: { message: { type: 'string' } } },
        },
      ]);

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new StrandsPlugin({
          models: {
            bedrock: () =>
              new StubModel([toolCallTurn('echo', 'call_1', { message: 'hi' }), textTurn('echoed')]),
          },
          mcpClients: { echo: echoFactory },
        }),
      ],
    });

    const result = await worker.runUntil(
      client.workflow.execute(mcpWorkflow, {
        args: ['echo hi'],
        workflowId: 'test-mcp',
        taskQueue,
      })
    );
    assert.equal(result, 'echoed');
  });
});
