// @@@SNIPSTART typescript-esm-client
import { Client } from '@temporalio/client';
import { example } from './workflows.js';

const client = new Client();
const result = await client.workflow.execute(example, {
  taskQueue: 'fetch-esm',
  workflowId: 'my-business-id',
  args: ['Temporal'],
});
console.log(result); // Hello, Temporal!
// @@@SNIPEND
