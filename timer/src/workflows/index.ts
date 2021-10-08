// @@@SNIPSTART nodejs-timer-reminder-workflow
import { createActivityHandle, sleep } from '@temporalio/workflow';
import { ProcessOrder } from '../interfaces';
// Only import the activity types
import type * as activities from '../activities';

const { processOrder, sendNotificationEmail } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

/** A workflow that simply calls an activity */
export const processOrderWorkflow: ProcessOrder = ({ orderProcessingMS, sendDelayedEmailTimeoutMS }) => ({
  async execute(): Promise<void> {
    let processing = true;
    let processOrderPromise = processOrder(orderProcessingMS).then(() => {
      processing = false;
    });

    await Promise.race([processOrderPromise, sleep(sendDelayedEmailTimeoutMS)]);

    if (processing) {
      await sendNotificationEmail();

      await processOrderPromise;
    }
  },
});
// @@@SNIPEND
