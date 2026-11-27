import { log } from '@temporalio/activity';

export type ReminderInput = { text: string };

export async function addReminderToDatabase(_input: ReminderInput): Promise<void> {
  log.info('Adding reminder record to the database');
}

export async function notifyUser({ text }: ReminderInput): Promise<void> {
  log.info('Notifying user', { text });
}
