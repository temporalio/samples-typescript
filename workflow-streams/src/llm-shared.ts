/**
 * Types and constants for the LLM-streaming scenario.
 *
 * Kept separate from `shared.ts` because the other scenarios don't use these,
 * and this scenario runs on its own worker and task queue so the `openai`
 * dependency stays out of everyone else's path.
 */

import type { WorkflowStreamState } from '@temporalio/workflow-streams/workflow';

// Scenario 5 runs on its own worker so the openai dependency only matters
// for that scenario.
export const LLM_TASK_QUEUE = 'workflow-stream-llm-task-queue';

// Topics published by the activity.
export const TOPIC_DELTA = 'delta';
export const TOPIC_COMPLETE = 'complete';
export const TOPIC_RETRY = 'retry';

export const DEFAULT_LLM_MODEL = 'gpt-5-mini';

export interface LLMInput {
  prompt: string;
  model?: string;
  streamState?: WorkflowStreamState;
}

export interface TextDelta {
  text: string;
}

export interface TextComplete {
  fullText: string;
}

export interface RetryEvent {
  attempt: number;
}
