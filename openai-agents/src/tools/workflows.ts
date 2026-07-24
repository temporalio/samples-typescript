import { Agent } from '@openai/agents-core';
import { webSearchTool, imageGenerationTool, codeInterpreterTool } from '@openai/agents-openai';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';

export async function webSearch(prompt: string): Promise<string> {
  const agent = new Agent({
    name: 'WebSearchAgent',
    instructions: 'Use the web search tool to find current information, then answer concisely.',
    tools: [webSearchTool()],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function imageGeneration(prompt: string): Promise<string> {
  const agent = new Agent({
    name: 'ImageAgent',
    instructions:
      'Use the image generation tool to create an image for the user request, then reply with a one-sentence caption describing the image you created.',
    tools: [imageGenerationTool({ outputFormat: 'webp', quality: 'low', outputCompression: 50 })],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function codeInterpreter(prompt: string): Promise<string> {
  const agent = new Agent({
    name: 'CodeAgent',
    instructions: 'Use the code interpreter tool to compute results, then explain the answer.',
    tools: [codeInterpreterTool()],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}
