import { Worker, WorkerOptions } from '@temporalio/worker';
import { createActivities } from './activities';
import { createClients } from './clients';

// worker
async function run() {
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'saga-demo';

  // registrations
  const singletonClients = await createClients();
  const activities = createActivities(singletonClients);

  const opts: WorkerOptions = {
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue,
  };

  const worker = await Worker.create(opts);

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
