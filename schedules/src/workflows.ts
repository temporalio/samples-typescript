import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { addReminderToDatabase, notifyUser } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function reminder(text: string): Promise<void> {
  await addReminderToDatabase(text);
  await notifyUser(text);
}
