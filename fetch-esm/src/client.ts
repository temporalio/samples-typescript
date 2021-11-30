// @@@SNIPSTART typescript-esm-client
import { WorkflowClient } from '@temporalio/client';
import { example } from './workflows.js';

const client = new WorkflowClient();
const result = await client.execute(example, {
  taskQueue: 'fetch-esm',
  workflowId: 'my-business-id',
  args: ['Temporal'],
});
console.log(result); // Hello, Temporal!
// @@@SNIPEND
