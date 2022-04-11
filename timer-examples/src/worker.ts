import { Worker } from '@temporalio/worker';
import dotenv from 'dotenv';
import { createActivities } from './activities';

dotenv.config();

const { MAILGUN_API: apiKey, MAILGUN_DOMAIN: domain, ADMIN_EMAIL: to } = process.env;

async function run(): Promise<void> {
  const activities = createActivities({ apiKey, domain }, {
    to,
    from: `Temporal Bot <temporal@${domain}>`,
  });

  const worker = await Worker.create({
    taskQueue: 'timer-examples',
    activities,
    workflowsPath: require.resolve('./workflows'),
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
