// @@@SNIPSTART nodejs-timer-reminder-activity
import { Context } from '@temporalio/activity';
import mailgun from 'mailgun-js';

export interface EmailSettings {
  to: string;
  from: string;
}

export const createActivities = (
  mg: mailgun.Mailgun,
  { to, from }: EmailSettings
): { processOrder: (sleepMS: number) => Promise<void>; sendNotificationEmail: () => Promise<void> } => ({
  async processOrder(sleepMS = 1000): Promise<void> {
    await Context.current().sleep(sleepMS);
  },

  async sendNotificationEmail(): Promise<void> {
    const data = {
      to,
      from,
      subject: 'Order processing taking longer than expected',
      html: "Order processing is taking longer than expected, but don't worry, the job is still running!",
    };

    await mg.messages().send(data);
  },
});
// @@@SNIPEND
