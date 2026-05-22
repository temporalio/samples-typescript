import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { TOPIC_PROGRESS, type ProgressEvent } from './shared';

/**
 * Pretend to charge a card, publishing progress to the parent workflow.
 *
 * `WorkflowStreamClient.fromActivity()` reads the parent workflow id and the
 * Temporal client from the activity context, so this activity can push events
 * back without any wiring.
 */
export async function chargeCard(orderId: string): Promise<string> {
  await using client = WorkflowStreamClient.fromActivity({ batchInterval: '200 milliseconds' });
  const progress = client.topic<ProgressEvent>(TOPIC_PROGRESS);

  progress.publish({ message: 'charging card...' });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  progress.publish({ message: 'card charged' });

  return `charge-${orderId}`;
}
