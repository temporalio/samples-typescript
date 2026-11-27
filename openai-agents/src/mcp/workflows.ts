import { Agent } from '@openai/agents-core';
import { TemporalOpenAIRunner, statelessMcpServer, statefulMcpServer } from '@temporalio/openai-agents/workflow';
import { proxyActivities } from '@temporalio/workflow';
import type { Activities } from './activities';

const activities = proxyActivities<Activities>({ startToCloseTimeout: '1 minute' });

// @@@SNIPSTART typescript-openai-agents-stateless-mcp-workflow
type FilesystemInput = { prompt: string };
type FilesystemResult = { text: string };

export async function filesystem({ prompt }: FilesystemInput): Promise<FilesystemResult> {
  const agent = new Agent({
    name: 'FilesystemAgent',
    instructions: 'You are a helpful assistant with access to a filesystem.',
    mcpServers: [statelessMcpServer('filesystem')],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}
// @@@SNIPEND

type StreamableHttpInput = { prompt: string };
type StreamableHttpResult = { text: string };

export async function streamableHttp({ prompt }: StreamableHttpInput): Promise<StreamableHttpResult> {
  const agent = new Agent({
    name: 'StreamableHttpAgent',
    instructions: 'You are a helpful assistant with access to tools via HTTP.',
    mcpServers: [statelessMcpServer('streamableHttp')],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}

type SseInput = { prompt: string };
type SseResult = { text: string };

export async function sse({ prompt }: SseInput): Promise<SseResult> {
  const agent = new Agent({
    name: 'SseAgent',
    instructions: 'You are a helpful assistant with access to tools via SSE.',
    mcpServers: [statelessMcpServer('sse')],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}

type PromptServerInput = { prompt: string };
type PromptServerResult = { text: string };

export async function promptServer({ prompt }: PromptServerInput): Promise<PromptServerResult> {
  const { instructions } = await activities.fetchSummarizePrompt();
  const agent = new Agent({
    name: 'PromptAgent',
    instructions,
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}

// @@@SNIPSTART typescript-openai-agents-stateful-mcp-workflow
type StatefulMemoryInput = { prompt: string };
type StatefulMemoryResult = { text: string };

export async function statefulMemory({ prompt }: StatefulMemoryInput): Promise<StatefulMemoryResult> {
  const server = statefulMcpServer('memory');
  await server.connect();
  try {
    const agent = new Agent({
      name: 'MemoryAgent',
      instructions: 'You are a helpful assistant with access to a persistent notes store.',
      mcpServers: [server],
    });
    const result = await new TemporalOpenAIRunner().run(agent, prompt);
    return { text: result.finalOutput ?? '' };
  } finally {
    await server.cleanup();
  }
}
// @@@SNIPEND
