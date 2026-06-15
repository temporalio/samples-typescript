import * as readline from 'node:readline';
import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { customerServiceWorkflow, processUserMessage, getHistory } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const workflowId = 'openai-agents-customer-service-' + nanoid();
  const handle = await client.workflow.start(customerServiceWorkflow, {
    taskQueue: 'openai-agents-customer-service',
    workflowId,
  });
  console.log(`Started chat workflow ${workflowId}`);
  console.log('Type a message and press Enter. Type "history" to print the transcript, "exit" to quit.\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

  try {
    for (;;) {
      const line = (await ask('you> ')).trim();
      if (!line) continue;
      if (line === 'exit') break;
      if (line === 'history') {
        const history = await handle.query(getHistory);
        console.log(history.join('\n'));
        continue;
      }
      const reply = await handle.executeUpdate(processUserMessage, { args: [line] });
      console.log(`agent> ${reply}\n`);
    }
  } finally {
    rl.close();
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
