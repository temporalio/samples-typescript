import { Context } from '@temporalio/activity';

export async function addReminderToDatabase(_text: string): Promise<void> {
  Context.current().log.info('Adding reminder record to the database');
}

export async function notifyUser(text: string): Promise<void> {
  Context.current().log.info(`Notifying user
Reminder: ${text}`);
}
