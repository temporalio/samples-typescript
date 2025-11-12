import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { oneAtATimeWorkflow } from './workflows';
import { nanoid } from 'nanoid';

const resourceId = process.argv[2];
if (!resourceId) {
  throw new Error('Must set resourceId');
}

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const workflowId = 'test-' + nanoid();

  console.log('Starting test workflow with id', workflowId, 'connecting to lock workflow', resourceId);
  const start = Date.now();
  await client.workflow.execute(oneAtATimeWorkflow, {
    taskQueue: 'mutex',
    workflowId,
    args: [resourceId, 5000, 7500],
  });
  console.log('Test workflow finished after', Date.now() - start, 'ms');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
