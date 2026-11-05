import { createInterface } from 'readline/promises';
import { Connection, Client } from '@temporalio/client';
import { nanoid } from 'nanoid';
import { agentChat, getChatState, sendMessage } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });
  const handle = await client.workflow.start(agentChat, {
    taskQueue: 'google-adk-agent-chat',
    workflowId: 'google-adk-agent-chat-' + nanoid(),
  });
  const input = createInterface({ input: process.stdin, output: process.stdout });
  for (;;) {
    const prompt = await input.question('you> ');
    if (prompt === '/quit') break;
    if (prompt === '/history') {
      console.log((await handle.query(getChatState)).messages);
      continue;
    }
    console.log(`assistant> ${await handle.executeUpdate(sendMessage, { args: [prompt] })}`);
  }
  input.close();
  await handle.terminate();
  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
