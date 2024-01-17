import { log } from '@temporalio/activity';

export async function addReminderToDatabase(_text: string): Promise<void> {
  log.info('Adding reminder record to the database');
}

export async function notifyUser(text: string): Promise<void> {
  log.info('Notifying user', { text });
}
