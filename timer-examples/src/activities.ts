/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Context } from '@temporalio/activity';
import mailgun from 'mailgun-js';

export interface EmailSettings {
  to: string | undefined;
  from: string;
}

const html = `Order processing is taking longer than expected, but don't worry—the job is still running!`;

export const createActivities = (mg: mailgun.Mailgun | undefined, { to, from }: EmailSettings) => ({
  async processOrder(sleepMS = 1000): Promise<void> {
    await Context.current().sleep(sleepMS);
  },

  async sendNotificationEmail(): Promise<void> {
    console.log('Sending email:', html);

    if (mg && to) {
      const data = {
        to,
        from,
        subject: 'Order processing taking longer than expected',
        html,
      };

      await mg.messages().send(data);
    }
  },
});
