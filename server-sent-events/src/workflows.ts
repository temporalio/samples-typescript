// @@@SNIPSTART typescript-hello-workflow
import * as workflow from '@temporalio/workflow';
// Only import the activity types
import type { Activities } from './activities';

const { sendEvent, broadcastEvent } = workflow.proxyActivities<Activities>({
  startToCloseTimeout: '1 minute',
  taskQueue: 'sse-task-queue',
});

type Event = {
  clientId?: string;
  type: string;
  data: unknown;
};

type SSEWorkflowInput = {
  event: Event;
};

/** A workflow that publishes events through SSE */
export async function sseWorkflow({ event }: SSEWorkflowInput) {
  if (event.clientId) {
    await sendEvent({ clientId: event.clientId, event: { data: event.data, type: event.type } });
    return;
  }

  await broadcastEvent({ event: { data: event.data, type: event.type } });
}
// @@@SNIPEND
