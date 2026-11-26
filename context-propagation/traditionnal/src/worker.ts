import { Worker } from '@temporalio/worker';
import * as activities from './activities';
import { newContextActivityInterceptor } from './context/activity-interceptors';

async function main() {
  // Create a worker that uses the Runtime instance installed above
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'context-propagation',
    interceptors: {
      activity: [newContextActivityInterceptor],
      workflowModules: [require.resolve('./context/workflow-interceptors')],
    },
  });
  await worker.run();
}

main().then(
  () => void process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
