import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import type { ReasoningResponse } from './activities';

const { getReasoningResponse } = proxyActivities<typeof activities>({ startToCloseTimeout: '5 minutes' });

export interface ReasoningResult {
  prompt: string;
  reasoningContent: string | null;
  content: string | null;
}

export async function reasoningContent(input: activities.ReasoningInput): Promise<ReasoningResult> {
  const { prompt } = input;
  const response: ReasoningResponse = await getReasoningResponse(input);
  return { prompt, reasoningContent: response.reasoningContent, content: response.content };
}
