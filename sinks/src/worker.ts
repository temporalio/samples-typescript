// @@@SNIPSTART typescript-logger-sink-worker
import { InjectedSinks, Worker } from '@temporalio/worker';
import { MySinks } from './workflows';

async function main() {
  const sinks: InjectedSinks<MySinks> = {
    alerter: {
      alert: {
        fn(workflowInfo, message) {
          console.log('sending SMS alert!', {
            workflowId: workflowInfo.workflowId,
            workflowRunId: workflowInfo.runId,
            message,
          });
        },
        callDuringReplay: false, // The default
      },
    },
  };
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    taskQueue: 'sinks',
    sinks,
  });
  await worker.run();
  console.log('Worker gracefully shutdown');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
