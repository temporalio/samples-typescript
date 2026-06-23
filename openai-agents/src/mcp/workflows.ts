import { Agent } from '@openai/agents-core';
import { TemporalOpenAIRunner, statelessMcpServer, statefulMcpServer } from '@temporalio/openai-agents/workflow';
import { proxyActivities } from '@temporalio/workflow';
import type { Activities } from './activities';

const activities = proxyActivities<Activities>({ startToCloseTimeout: '1 minute' });

export async function filesystem(prompt: string): Promise<string> {
  const agent = new Agent({
    name: 'FilesystemAgent',
    instructions: 'You are a helpful assistant with access to a filesystem.',
    mcpServers: [statelessMcpServer('filesystem')],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function streamableHttp(prompt: string): Promise<string> {
  const agent = new Agent({
    name: 'StreamableHttpAgent',
    instructions: 'You are a helpful assistant with access to tools via HTTP.',
    mcpServers: [statelessMcpServer('streamableHttp')],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function sse(prompt: string): Promise<string> {
  const agent = new Agent({
    name: 'SseAgent',
    instructions: 'You are a helpful assistant with access to tools via SSE.',
    mcpServers: [statelessMcpServer('sse')],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function promptServer(prompt: string): Promise<string> {
  const instructions = await activities.fetchSummarizePrompt();
  const agent = new Agent({
    name: 'PromptAgent',
    instructions,
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function statefulMemory(prompt: string): Promise<string> {
  const server = statefulMcpServer('memory');
  await server.connect();
  try {
    const agent = new Agent({
      name: 'MemoryAgent',
      instructions: 'You are a helpful assistant with access to a persistent notes store.',
      mcpServers: [server],
    });
    const result = await new TemporalOpenAIRunner().run(agent, prompt);
    return result.finalOutput ?? '';
  } finally {
    await server.cleanup();
  }
}
