// @@@SNIPSTART typescript-start-workflow
import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nanoid } from 'nanoid';
import { example } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = await client.workflow.start(example, {
    // required
    taskQueue: 'snippets',
    // required
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Started Workflow ${handle.workflowId}`);
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
