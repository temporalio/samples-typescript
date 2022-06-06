import { Connection, WorkflowClient } from '@temporalio/client';
import { v4 as uuid } from 'uuid';
import { getDataConverter } from './data-converter';
import { example } from './workflows';

async function run() {
  // @@@SNIPSTART typescript-encryption-client
  const client = new WorkflowClient({
    dataConverter: await getDataConverter(),
  });

  const handle = await client.start(example, {
    args: ['Alice: Private message for Bob.'],
    taskQueue: 'encryption',
    workflowId: `my-business-id-${uuid()}`,
  });

  console.log(`Started workflow ${handle.workflowId}`);
  console.log(await handle.result());
  // @@@SNIPEND
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
