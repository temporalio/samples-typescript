import { Connection, Client } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities: activities.createActivities(client),
    taskQueue: 'mutex',
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
