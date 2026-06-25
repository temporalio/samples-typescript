import { NativeConnection, Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin, StatelessMCPServerProvider, StatefulMCPServerProvider } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { MCPServerStdio, MCPServerStreamableHttp, MCPServerSSE } from '@openai/agents-core';
import * as path from 'path';
import { makeActivities } from './activities';
import { startToolsHttpServer } from './servers/tools-server';
import { startToolsSseServer } from './servers/sse-server';
import { startPromptHttpServer } from './servers/prompt-server';
import { createNotesServer } from './servers/notes-server';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const toolsHttp = await startToolsHttpServer();
  const toolsSse = await startToolsSseServer();
  const promptHttp = await startPromptHttpServer();

  const connection = await NativeConnection.connect({ address: 'localhost:7233' });

  try {
    const activities = makeActivities(promptHttp.url);

    const filesystemServerPath = path.resolve(__dirname, 'servers', 'filesystem-server.ts');

    const worker = await Worker.create({
      connection,
      taskQueue: 'openai-agents-mcp',
      workflowsPath: require.resolve('./workflows'),
      activities,
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: new OpenAIProvider({ apiKey }),
          modelParams: { useLocalActivity: true },
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
            new StatelessMCPServerProvider(
              'streamableHttp',
              () => new MCPServerStreamableHttp({ url: toolsHttp.url, name: 'streamableHttp' }),
            ),
            new StatelessMCPServerProvider('sse', () => new MCPServerSSE({ url: toolsSse.url, name: 'sse' })),
            new StatefulMCPServerProvider('memory', () => createNotesServer(), connection),
          ],
        }),
      ],
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

    await worker.run();
  } finally {
    await Promise.allSettled([toolsHttp.close(), toolsSse.close(), promptHttp.close()]);
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
