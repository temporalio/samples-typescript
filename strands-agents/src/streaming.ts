// @@@SNIPSTART typescript-strands-streaming-client
import { Client, Connection } from '@temporalio/client';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { streamingWorkflow } from './workflows';

interface StreamEvent {
  type?: string;
  delta?: { type?: string; text?: string };
}

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  const client = new Client({ connection });
  const workflowId = 'strands-streaming';

  const handle = await client.workflow.start(streamingWorkflow, {
    args: ['Count from 1 to 5, one number per sentence.'],
    taskQueue: 'strands-agents',
    workflowId,
  });

  const stream = WorkflowStreamClient.create(client, workflowId);
  const consume = (async () => {
    for await (const item of stream.subscribe<StreamEvent>(['events'], 0, {
      pollCooldown: '50 milliseconds',
      resultType: true,
    })) {
      const event = item.data;
      if (event.type === 'modelContentBlockDeltaEvent' && event.delta?.type === 'textDelta' && event.delta.text) {
        process.stdout.write(event.delta.text);
      } else if (event.type === 'modelMessageStopEvent') {
        process.stdout.write('\n');
        return;
      }
    }
  })();

  const result = await handle.result();
  await consume;
  console.log(`Final result: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
