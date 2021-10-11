// @@@SNIPSTART nodejs-timer-reminder-workflow
import { createActivityHandle, sleep } from '@temporalio/workflow';
// Only import the activity types
import type { createActivities } from './activities';

const { processOrder, sendNotificationEmail } = createActivityHandle<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '5 minutes',
});

export interface ProcessOrderOptions {
  orderProcessingMS: number;
  sendDelayedEmailTimeoutMS: number;
}

/** A workflow that simply calls an activity */
export async function processOrderWorkflow({
  orderProcessingMS,
  sendDelayedEmailTimeoutMS,
}: ProcessOrderOptions): Promise<void> {
  let processing = true;
  let processOrderPromise = processOrder(orderProcessingMS).then(() => {
    processing = false;
  });

  await Promise.race([processOrderPromise, sleep(sendDelayedEmailTimeoutMS)]);

  if (processing) {
    await sendNotificationEmail();

    await processOrderPromise;
  }
}
// @@@SNIPEND
