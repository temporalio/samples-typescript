import { InjectedSinks, Worker, WorkerOptions } from '@temporalio/worker';
import { createActivities } from './activities';
import { createClients } from './clients';
import { LoggerSinks } from './workflows';

// worker
async function run() {
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'saga-demo';

  const sinks: InjectedSinks<LoggerSinks> = {
    logger: {
      info: {
        fn(workflowInfo, message) {
          console.log('workflow: ', workflowInfo.runId, 'message: ', message);
        },
        callDuringReplay: false, // The default
      },
      err: {
        fn(workflowInfo, message) {
          console.error('workflow: ', workflowInfo.runId, 'message: ', message);
        },
        callDuringReplay: false, // The default
      },
    },
  };

  // registrations
  const singletonClients = await createClients();
  const activities = createActivities(singletonClients) as any;

  const opts: WorkerOptions = {
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue,
    sinks,
  };

  const worker = await Worker.create(opts);

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
