import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { Type } from '@google/genai';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { mockMcpToolset, type MockMcpToolDefinition } from '@temporalio/google-adk-agents/testing';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { listFilesystemTools } from '../workflows';

const readFileDef: MockMcpToolDefinition = {
  declaration: {
    name: 'read_file',
    description: 'Read a file.',
    parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING } }, required: ['path'] },
  },
  handler: (args) => ({ contents: `contents of ${String(args.path)}` }),
};

const listDirDef: MockMcpToolDefinition = {
  declaration: {
    name: 'list_directory',
    description: 'List a directory.',
    parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING } } },
  },
  handler: () => ({ entries: ['hello.txt'] }),
};

describe('google-adk-agents/mcp workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('listFilesystemTools: TemporalMcpToolSet discovers tools via the named factory', async () => {
    const taskQueue = 'test-google-adk-mcp';
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ mcpToolsets: { filesystem: mockMcpToolset([readFileDef, listDirDef]) } })],
    });
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(listFilesystemTools, {
        workflowId: 'test-google-adk-mcp-' + Date.now(),
        taskQueue,
      }),
    );
    assert.deepStrictEqual(result, ['read_file', 'list_directory']);
  });
});
