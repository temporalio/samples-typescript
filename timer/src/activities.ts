// @@@SNIPSTART nodejs-timer-reminder-activity
import { config } from 'dotenv';
import mailgun from 'mailgun-js';

config();

const apiKey: string = process.env.MAILGUN_API as string;
const domain: string = process.env.MAILGUN_DOMAIN as string;
const to: string = process.env.ADMIN_EMAIL as string;

const mg = mailgun({ apiKey, domain });

export async function processOrder(sleepMS = 1000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, sleepMS));
};

export async function sendNotificationEmail(): Promise<void> {
  const data = {
    to,
    subject: 'Order processing taking longer than expected',
    from: 'Temporal Bot <temporal@' + process.env.MAILGUN_DOMAIN + '>',
    html: 'Order processing is taking longer than expected, but don\'t worry, the job is still running!'
  };

  await mg.messages().send(data);
};
// @@@SNIPEND
