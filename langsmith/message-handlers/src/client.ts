import { Connection, Client } from '@temporalio/client';
import { Client as LangSmithClient } from 'langsmith';
import { LangSmithPlugin } from '@temporalio/langsmith';
import { nanoid } from 'nanoid';
import { ConversationWorkflow, complete, composeReply, handleMessage } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const langsmith = new LangSmithClient();
  const plugin = new LangSmithPlugin({ client: langsmith, addTemporalRuns: true });
  const client = new Client({ connection, plugins: [plugin] });

  const handle = await client.workflow.start(ConversationWorkflow, {
    taskQueue: 'langsmith-message-handlers',
    workflowId: 'langsmith-message-handlers-' + nanoid(),
  });

  await handle.signal(handleMessage, 'when is my order arriving?');
  const reply = await handle.executeUpdate(composeReply, { args: ['please send my tracking number'] });
  console.log(reply);

  await handle.signal(complete);
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
