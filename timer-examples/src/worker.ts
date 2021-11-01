import { Worker } from '@temporalio/worker';
import dotenv from 'dotenv';
import mailgun from 'mailgun-js';
import { createActivities } from './activities';

dotenv.config();

const errs = [] as string[];
function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    errs.push(`Missing '${key}' environment variable`);
    return 'ERROR';
  }
  return val;
}

async function run(): Promise<void> {
  const apiKey = getEnv('MAILGUN_API');
  const domain = getEnv('MAILGUN_DOMAIN');
  const to = getEnv('ADMIN_EMAIL');
  if (errs.length) throw new Error(errs.join('\n'));
  const mg = mailgun({ apiKey, domain });

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
