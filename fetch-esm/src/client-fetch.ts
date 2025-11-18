// @@@SNIPSTART typescript-esm-client
import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { exampleFetch } from './workflows.ts';

const config = loadClientConnectConfig();
const connection = await Connection.connect(config.connectionOptions);
const client = new Client({ connection });
const result = await client.workflow.execute(exampleFetch, {
  taskQueue: 'fetch-esm',
  workflowId: `my-business-id-${Date.now()}`,
  args: ['Temporal'],
});
console.log(result); // Hello, Temporal!
// @@@SNIPEND
