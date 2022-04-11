/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Context } from '@temporalio/activity';
import axios from 'axios';

export interface EmailSettings {
  to: string | undefined;
  from: string;
}

const subject = 'Order processing taking longer than expected';
const html = `Order processing is taking longer than expected, but don't worry—the job is still running!`;

export const createActivities = ({ apiKey, domain }: { apiKey?: string, domain?: string }, { to, from }: EmailSettings) => ({
  async processOrder(sleepMS = 1000): Promise<void> {
    await Context.current().sleep(sleepMS);
  },

  async sendNotificationEmail(): Promise<void> {
    console.log('Sending email:', html);

    if (apiKey && domain && to) {
      await axios({
        url: 'https://api.mailgun.net/v3/' + domain + '/messages',
        method: 'post',
        params: { to, from, subject, html },
        auth: {
          username: 'api',
          password: apiKey
        }
      });
    }
  },
});
