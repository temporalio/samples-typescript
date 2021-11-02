import { createActivityHandle, sleep } from '@temporalio/workflow';
// Only import the activity types
import type { createActivities } from './activities';
export * from './updatable-timer';

const { processOrder, sendNotificationEmail } = createActivityHandle<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '5 minutes',
});

export interface ProcessOrderOptions {
  orderProcessingMS: number;
  sendDelayedEmailTimeoutMS: number;
}

// @@@SNIPSTART typescript-timer-reminder-workflow
export async function processOrderWorkflow({
  orderProcessingMS,
  sendDelayedEmailTimeoutMS,
}: ProcessOrderOptions): Promise<void> {
  let processing = true;
  const processOrderPromise = processOrder(orderProcessingMS).then(() => {
    processing = false;
  });

  await Promise.race([processOrderPromise, sleep(sendDelayedEmailTimeoutMS)]);

  if (processing) {
    await sendNotificationEmail();

    await processOrderPromise;
  }
}
// @@@SNIPEND
