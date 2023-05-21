import { Worker } from '@temporalio/worker';
import { Connection, Client } from '@temporalio/client';

async function run() {
  // @@@SNIPSTART typescript-history-get-workflowhistory
  const connection = await Connection.connect(/* { address: 'temporal.prod.company.com' } */);
  const client = new Client({ connection, namespace: 'default' });
  const workflowId = 'calc';
  const handle = client.workflow.getHandle(workflowId);
  const history = await handle.fetchHistory();
  // @@@SNIPEND
  if (!history) {
    throw new Error('Empty history');
  }
  // @@@SNIPSTART typescript-history-replay
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
