import { Worker, Runtime, DefaultLogger, LogEntry } from '@temporalio/worker';
import { Connection } from '@temporalio/client';

async function run() {
  // @@@SNIPSTART typescript-history-get-workflowhistory
  const conn = await Connection.connect(/* { address: 'temporal.prod.company.com' } */);
  const { history } = await conn.workflowService.getWorkflowExecutionHistory({
    namespace: 'default',
    execution: {
      workflowId: 'calc',
    },
  });
  // @@@SNIPEND
  if (!history) {
    throw new Error('Empty history');
  }
  // @@@SNIPSTART typescript-history-get-workflowhistory

  // Filter INFO log messages for clearer test output
  Runtime.install({
    logger: new DefaultLogger('WARN', (entry: LogEntry) => console.log(`[${entry.level}]`, entry.message)),
  });

  await Worker.runReplayHistory(
    {
      workflowsPath: require.resolve('./workflows'),
      replayName: 'calc',
    },
    history
  );
  // @@@SNIPEND
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
