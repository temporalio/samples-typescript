import { Worker } from '@temporalio/worker';
import dotenv from 'dotenv';
import mailgun from 'mailgun-js';
import { createActivities } from './activities';

dotenv.config();

const { MAILGUN_API: apiKey, MAILGUN_DOMAIN: domain, ADMIN_EMAIL: to } = process.env;

async function run(): Promise<void> {
  let mg;
  if (apiKey && domain) {
    mg = mailgun({ apiKey, domain });
  }

  const activities = createActivities(mg, {
    to,
    from: `Temporal Bot <temporal@${domain}>`,
  });

  const worker = await Worker.create({
    taskQueue: 'tutorial20210928',
    activities,
    workflowsPath: require.resolve('./workflows'),
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
