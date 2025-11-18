// @@@SNIPSTART typescript-esm-client
import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { exampleHello } from './workflows.ts';

const config = loadClientConnectConfig();
const connection = await Connection.connect(config.connectionOptions);
const client = new Client({ connection });
const result = await client.workflow.execute(exampleHello, {
  taskQueue: 'fetch-esm',
  workflowId: `my-business-id-${Date.now()}`,
  args: ['Wonderful-Temporal'],
});
console.log(result); // Hello World And Hello Wonderful Temporal!
// @@@SNIPEND
