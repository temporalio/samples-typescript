import { proxyActivities, sleep } from '@temporalio/workflow';
// Only import the activity types
import type { createActivities } from './activities';
export * from './updatable-timer';

export interface ProcessOrderOptions {
  orderProcessingMS: number;
  sendDelayedEmailTimeoutMS: number;
}

const { sendNotificationEmail } = proxyActivities<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '5m',
});

// @@@SNIPSTART typescript-timer-reminder-workflow
type ProcessOrderResult = { message: string };

export async function processOrderWorkflow({
  orderProcessingMS,
  sendDelayedEmailTimeoutMS,
}: ProcessOrderOptions): Promise<ProcessOrderResult> {
  let processing = true;
  // Dynamically define the timeout based on given input
  const { processOrder } = proxyActivities<ReturnType<typeof createActivities>>({
    startToCloseTimeout: orderProcessingMS,
  });

  const processOrderPromise = processOrder().then(() => {
    processing = false;
  });

  await Promise.race([processOrderPromise, sleep(sendDelayedEmailTimeoutMS)]);

  if (processing) {
    await sendNotificationEmail();

    await processOrderPromise;
  }

  return { message: 'Order completed!' };
}
// @@@SNIPEND
