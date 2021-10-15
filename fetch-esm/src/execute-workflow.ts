// @@@SNIPSTART typescript-esm-execute-workflow
import { WorkflowClient } from '@temporalio/client';
import { example } from './workflows.js';

const client = new WorkflowClient();
const handle = client.createWorkflowHandle(example, { taskQueue: 'tutorial' });
const result = await handle.execute('Temporal');
console.log(result); // Hello, Temporal!
// @@@SNIPEND
