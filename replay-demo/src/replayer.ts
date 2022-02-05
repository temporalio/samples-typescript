import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';

async function run() {
  const conn = new Connection(/* address: 'temporal.prod.company.com' */);
  const { history } = await conn.service.getWorkflowExecutionHistory({
    namespace: 'default',
    execution: {
      workflowId: 'calc',
    },
  });
  if (!history) {
    throw new Error('Empty history');
  }
  await Worker.runReplayHistory(
    {
      workflowsPath: require.resolve('./workflows'),
      replayName: 'calc',
    },
    history
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
