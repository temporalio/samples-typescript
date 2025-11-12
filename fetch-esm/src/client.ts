// @@@SNIPSTART typescript-esm-client
import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { example } from './workflows.js';

const config = loadClientConnectConfig();
const connection = await Connection.connect(config.connectionOptions);
const client = new Client({ connection });
const result = await client.workflow.execute(example, {
  taskQueue: 'fetch-esm',
  workflowId: 'my-business-id',
  args: ['Temporal'],
});
console.log(result); // Hello, Temporal!
// @@@SNIPEND
