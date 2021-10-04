// @@@SNIPSTART nodejs-timer-reminder-activity
import { Context } from '@temporalio/activity';
import mailgun from 'mailgun-js';

const apiKey: string = process.env.MAILGUN_API ?? '';
const domain: string = process.env.MAILGUN_DOMAIN ?? '';
const to: string = process.env.ADMIN_EMAIL ?? '';

const mg = mailgun({ apiKey, domain });

export async function processOrder(sleepMS = 1000): Promise<void> {
  await Context.current().sleep(sleepMS);
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
