import { WorkflowClient } from '@temporalio/client';
import { setValueSignal } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  const handle = client.getHandle('state-id-0');

  await handle.signal(setValueSignal, 'meaning-of-life', 42);
  console.log('setValueSignal sent');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
