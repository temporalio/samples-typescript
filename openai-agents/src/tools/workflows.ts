import { Agent } from '@openai/agents-core';
import { webSearchTool, imageGenerationTool, codeInterpreterTool } from '@openai/agents-openai';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';

// @@@SNIPSTART typescript-openai-agents-hosted-tool-workflow
type WebSearchInput = { prompt: string };
type WebSearchResult = { text: string };

export async function webSearch({ prompt }: WebSearchInput): Promise<WebSearchResult> {
  const agent = new Agent({
    name: 'WebSearchAgent',
    instructions: 'Use the web search tool to find current information, then answer concisely.',
    tools: [webSearchTool()],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}
// @@@SNIPEND

type ImageGenerationInput = { prompt: string };
type ImageGenerationResult = { text: string };

export async function imageGeneration({ prompt }: ImageGenerationInput): Promise<ImageGenerationResult> {
  const agent = new Agent({
    name: 'ImageAgent',
    instructions:
      'Use the image generation tool to create an image for the user request, then reply with a one-sentence caption describing the image you created.',
    tools: [imageGenerationTool({ outputFormat: 'webp', quality: 'low', outputCompression: 50 })],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}

type CodeInterpreterInput = { prompt: string };
type CodeInterpreterResult = { text: string };

export async function codeInterpreter({ prompt }: CodeInterpreterInput): Promise<CodeInterpreterResult> {
  const agent = new Agent({
    name: 'CodeAgent',
    instructions: 'Use the code interpreter tool to compute results, then explain the answer.',
    tools: [codeInterpreterTool()],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}
