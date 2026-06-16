import type { WorkflowStreamState } from '@temporalio/workflow-streams/workflow';

export const TASK_QUEUE = 'workflow-stream-sample-task-queue';

// Topics published by the workflow / activity.
export const TOPIC_STATUS = 'status';
export const TOPIC_PROGRESS = 'progress';
export const TOPIC_NEWS = 'news';
export const TOPIC_TICK = 'tick';

export interface OrderInput {
  orderId: string;
  // Carries stream state across continue-as-new. undefined on a fresh start.
  streamState?: WorkflowStreamState;
}

export interface StatusEvent {
  kind: string;
  orderId: string;
}

export interface ProgressEvent {
  message: string;
}

export interface PipelineInput {
  pipelineId: string;
  streamState?: WorkflowStreamState;
}

export interface StageEvent {
  stage: string;
}

export interface HubInput {
  hubId: string;
  streamState?: WorkflowStreamState;
}

export interface NewsEvent {
  headline: string;
}

export interface TickerInput {
  count?: number;
  keepLast?: number;
  truncateEvery?: number;
  intervalMs?: number;
  streamState?: WorkflowStreamState;
}

export const TICKER_DEFAULTS = {
  count: 20,
  keepLast: 3,
  truncateEvery: 5,
  intervalMs: 400,
};

export interface TickEvent {
  n: number;
}
