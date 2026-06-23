import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin, StatelessMCPServerProvider, StatefulMCPServerProvider } from '@temporalio/openai-agents';
import { MCPServerStdio, MCPServerStreamableHttp, MCPServerSSE } from '@openai/agents-core';
import assert from 'assert';
import * as path from 'path';
import { FakeModelProvider, textResponse, toolCallResponse } from './fake-model';
import { filesystem, streamableHttp, sse, promptServer, statefulMemory } from '../workflows';
import { makeActivities } from '../activities';
import { startToolsHttpServer } from '../servers/tools-server';
import { startToolsSseServer } from '../servers/sse-server';
import { startPromptHttpServer, SUMMARIZE_PROMPT_TEXT } from '../servers/prompt-server';
import { createNotesServer } from '../servers/notes-server';

describe('openai-agents/mcp workflow scenarios', function () {
  this.timeout(60_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  const webpackConfigHook = (config: object & { resolve?: { conditionNames?: string[] } }) => ({
    ...config,
    resolve: {
      ...(config.resolve ?? {}),
      conditionNames: ['require', 'browser', 'default'],
    },
  });

  it('filesystem: MCP stdio tool result flows back to the model', async () => {
    const taskQueue = 'test-mcp-filesystem';
    const filesystemServerPath = path.resolve(__dirname, '..', 'servers', 'filesystem-server.ts');
    const provider = new FakeModelProvider([
      toolCallResponse('listFiles', {}),
      textResponse('The files are: hello.txt, notes.txt'),
    ]);

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: provider,
          mcpServerProviders: [
            new StatelessMCPServerProvider(
              'filesystem',
              () =>
                new MCPServerStdio({
                  command: 'npx',
                  args: ['ts-node', filesystemServerPath],
                  name: 'filesystem',
                }),
            ),
          ],
        }),
      ],
      bundlerOptions: { webpackConfigHook },
    });

    const result = await worker.runUntil(
      testEnv.client.workflow.execute(filesystem, {
        args: ['List the files.'],
        workflowId: 'test-mcp-filesystem-' + Date.now(),
        taskQueue,
      }),
    );

    assert.strictEqual(result, 'The files are: hello.txt, notes.txt');

    // The listFiles tool result must have been sent back to the model.
    const toolResults = provider.model.requests
      .flatMap((req) => (Array.isArray(req.input) ? req.input : []))
      .filter((item) => item.type === 'function_call_result' && (item as { name: string }).name === 'listFiles');
    assert.strictEqual(toolResults.length, 1, 'listFiles tool result should reach the model exactly once');
  });

  it('streamableHttp: MCP HTTP tool result flows back to the model', async () => {
    const taskQueue = 'test-mcp-streamable-http';
    const toolsHttp = await startToolsHttpServer();

    try {
      const provider = new FakeModelProvider([
        toolCallResponse('add', { a: 17, b: 25 }),
        textResponse('The answer is 42.'),
      ]);

      const worker = await Worker.create({
        connection: testEnv.nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('../workflows'),
        plugins: [
          new OpenAIAgentsPlugin({
            modelProvider: provider,
            mcpServerProviders: [
              new StatelessMCPServerProvider(
                'streamableHttp',
                () => new MCPServerStreamableHttp({ url: toolsHttp.url, name: 'streamableHttp' }),
              ),
            ],
          }),
        ],
        bundlerOptions: { webpackConfigHook },
      });

      const result = await worker.runUntil(
        testEnv.client.workflow.execute(streamableHttp, {
          args: ['What is 17 plus 25?'],
          workflowId: 'test-mcp-streamable-http-' + Date.now(),
          taskQueue,
        }),
      );

      assert.strictEqual(result, 'The answer is 42.');

      // The add tool must have returned "42" to the model.
      const toolResults = provider.model.requests
        .flatMap((req) => (Array.isArray(req.input) ? req.input : []))
        .filter((item) => item.type === 'function_call_result' && (item as { name: string }).name === 'add');
      assert.strictEqual(toolResults.length, 1, 'add tool result should reach the model exactly once');
      assert.deepStrictEqual((toolResults[0] as { output: unknown }).output, [{ type: 'input_text', text: '42' }]);
    } finally {
      await toolsHttp.close();
    }
  });

  it('sse: MCP SSE tool result flows back to the model', async () => {
    const taskQueue = 'test-mcp-sse';
    const toolsSse = await startToolsSseServer();

    try {
      const provider = new FakeModelProvider([
        toolCallResponse('getSecret', {}),
        textResponse('The secret is swordfish.'),
      ]);

      const worker = await Worker.create({
        connection: testEnv.nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('../workflows'),
        plugins: [
          new OpenAIAgentsPlugin({
            modelProvider: provider,
            mcpServerProviders: [
              new StatelessMCPServerProvider('sse', () => new MCPServerSSE({ url: toolsSse.url, name: 'sse' })),
            ],
          }),
        ],
        bundlerOptions: { webpackConfigHook },
      });

      const result = await worker.runUntil(
        testEnv.client.workflow.execute(sse, {
          args: ['What is the secret?'],
          workflowId: 'test-mcp-sse-' + Date.now(),
          taskQueue,
        }),
      );

      assert.strictEqual(result, 'The secret is swordfish.');

      // The getSecret tool must have returned "swordfish" to the model.
      const toolResults = provider.model.requests
        .flatMap((req) => (Array.isArray(req.input) ? req.input : []))
        .filter((item) => item.type === 'function_call_result' && (item as { name: string }).name === 'getSecret');
      assert.strictEqual(toolResults.length, 1, 'getSecret tool result should reach the model exactly once');
      assert.deepStrictEqual((toolResults[0] as { output: unknown }).output, [
        { type: 'input_text', text: 'swordfish' },
      ]);
    } finally {
      await toolsSse.close();
    }
  });

  it('promptServer: fetched prompt text becomes the agent instructions', async () => {
    const taskQueue = 'test-mcp-prompt-server';
    const promptHttp = await startPromptHttpServer();

    try {
      const provider = new FakeModelProvider([textResponse('Temporal is a durable execution platform.')]);

      const activities = makeActivities(promptHttp.url);

      const worker = await Worker.create({
        connection: testEnv.nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('../workflows'),
        activities,
        plugins: [new OpenAIAgentsPlugin({ modelProvider: provider })],
        bundlerOptions: { webpackConfigHook },
      });

      const result = await worker.runUntil(
        testEnv.client.workflow.execute(promptServer, {
          args: ['Temporal is a durable execution platform for building reliable distributed systems.'],
          workflowId: 'test-mcp-prompt-server-' + Date.now(),
          taskQueue,
        }),
      );

      assert.strictEqual(result, 'Temporal is a durable execution platform.');

      // The summarize prompt text must have been set as the agent's system instructions.
      const systemInstructions = provider.model.requests[0]?.systemInstructions;
      assert.strictEqual(
        systemInstructions,
        SUMMARIZE_PROMPT_TEXT,
        'fetched prompt text should become agent instructions (systemInstructions)',
      );
    } finally {
      await promptHttp.close();
    }
  });

  it('statefulMemory: state persists across multiple tool calls within the run', async () => {
    const taskQueue = 'test-mcp-stateful-memory';
    const provider = new FakeModelProvider([
      // First turn: save a note
      toolCallResponse('saveNote', { title: 'greeting', body: 'Hello, world!' }),
      // Second turn: read the note back
      toolCallResponse('readNote', { title: 'greeting' }),
      // Final turn: text response
      textResponse('I saved and read back: Hello, world!'),
    ]);

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: provider,
          mcpServerProviders: [
            new StatefulMCPServerProvider('memory', () => createNotesServer(), testEnv.nativeConnection),
          ],
        }),
      ],
      bundlerOptions: { webpackConfigHook },
    });

    const result = await worker.runUntil(
      testEnv.client.workflow.execute(statefulMemory, {
        args: ['Save a note titled "greeting" with body "Hello, world!" then read it back.'],
        workflowId: 'test-mcp-stateful-memory-' + Date.now(),
        taskQueue,
      }),
    );

    assert.strictEqual(result, 'I saved and read back: Hello, world!');

    // The readNote tool must have returned the saved note body to the model,
    // proving that state persisted across the saveNote call within the same run.
    const allInputItems = provider.model.requests.flatMap((req) => (Array.isArray(req.input) ? req.input : []));
    const readNoteResults = allInputItems.filter(
      (item) => item.type === 'function_call_result' && (item as { name: string }).name === 'readNote',
    );
    assert.strictEqual(readNoteResults.length, 1, 'readNote tool result should reach the model exactly once');
    assert.deepStrictEqual((readNoteResults[0] as { output: unknown }).output, [
      { type: 'input_text', text: 'Hello, world!' },
    ]);
  });
});
