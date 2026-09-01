import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import type { ReasoningResponse } from './activities';

const { getReasoningResponse } = proxyActivities<typeof activities>({ startToCloseTimeout: '5 minutes' });

export interface ReasoningResult {
  prompt: string;
  reasoningContent: string | null;
  content: string | null;
}

export async function reasoningContent(prompt: string, model: string): Promise<ReasoningResult> {
  const response: ReasoningResponse = await getReasoningResponse(prompt, model);
  return { prompt, reasoningContent: response.reasoningContent, content: response.content };
}
