export async function addReminderToDatabase(_text: string): Promise<void> {
  console.log('Adding reminder record to the database');
}

export async function notifyUser(text: string): Promise<void> {
  console.log(`Notifying user
Reminder: ${text}`);
}
