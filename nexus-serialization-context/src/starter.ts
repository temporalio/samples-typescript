import { randomUUID } from 'crypto';
import { Client, Connection } from '@temporalio/client';
import { NexusCodec } from './codec';
import { CALLER, ENDPOINTS } from './shared';
import { callerWorkflow } from './caller/workflows';

async function run() {
  const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233' });
  try {
    const client = new Client({ connection, namespace: CALLER, dataConverter: { payloadCodecs: [new NexusCodec()] } });
    const handle = await client.workflow.start(callerWorkflow, {
      workflowId: `nexus-serialization-${randomUUID()}`,
      taskQueue: CALLER,
      args: ['Hello from Nexus'],
    });
    console.log(`Started workflow: ${handle.workflowId}`);
    const results = await handle.result();
    for (const endpoint of ENDPOINTS) {
      console.log(`${endpoint}: sync="${results[endpoint].sync}" async="${results[endpoint].async}"`);
    }
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
