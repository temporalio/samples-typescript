import { Connection, Client } from '@temporalio/client';
import { sandboxWorkflow } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const handle = await client.workflow.start(sandboxWorkflow, {
    taskQueue: 'openai-agents-sandboxes',
    workflowId: 'openai-agents-sandboxes-' + nanoid(),
    args: [
      'Write the first 20 Fibonacci numbers to fib.txt, one per line, then tell me how many lines the file has ' +
        'and what its last line is. Also check whether SERVICE_TOKEN is set, without printing it.',
    ],
  });
  console.log(`Started workflow ${handle.workflowId}`);
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
