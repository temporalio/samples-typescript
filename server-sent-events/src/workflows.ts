// @@@SNIPSTART typescript-hello-workflow
import * as workflow from '@temporalio/workflow';
import { condition, continueAsNew, defineSignal, setHandler, workflowInfo } from '@temporalio/workflow';
// Only import the activity types
import type { Activities } from './activities';

const MAX_EVENTS_SIZE = 2000;

export const newEventSignal = defineSignal<[Event]>('newEvent');

export type Event = {
  clientId?: string;
  serverTaskQueue: string;
  type: string;
  data: unknown;
};

type SSEWorkflowInput = {
  roomId: string;
  events?: Event[];
};

/** A workflow that publishes events through SSE */
export async function chatRoomWorkflow({ roomId, events: originalEvents }: SSEWorkflowInput) {
  const { localBroadcast } = workflow.proxyActivities<Activities>({
    startToCloseTimeout: '1 minute',
  });

  const events: Event[] = originalEvents || [];

  setHandler(newEventSignal, (event) => {
    events.push(event);
  });

  while (workflowInfo().historyLength < MAX_EVENTS_SIZE) {
    await condition(() => events.length > 0, '1 hour');

    if (events.length === 0) {
      return;
    }

    while (events.length > 0) {
      const event = events.shift()!;

      await localBroadcast({ event: { data: event.data, type: event.type } });
    }
  }

  await continueAsNew<typeof chatRoomWorkflow>({ roomId, events });
}
// @@@SNIPEND
