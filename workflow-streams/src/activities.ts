import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { TOPIC_PROGRESS, type ProgressEvent } from './shared';

/**
 * Pretend to charge a card, publishing progress to the parent workflow.
 *
 * `WorkflowStreamClient.fromWithinActivity()` reads the parent workflow id and the
 * Temporal client from the activity context, so this activity can push events
 * back without any wiring.
 */
type ChargeCardInput = { orderId: string };
export type ChargeCardResult = { chargeId: string };

export async function chargeCard({ orderId }: ChargeCardInput): Promise<ChargeCardResult> {
  await using client = WorkflowStreamClient.fromWithinActivity({ batchInterval: '200 milliseconds' });
  const progress = client.topic<ProgressEvent>(TOPIC_PROGRESS);

  progress.publish({ message: 'charging card...' });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  progress.publish({ message: 'card charged' });

  return { chargeId: `charge-${orderId}` };
}
