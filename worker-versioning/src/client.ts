import { Connection, Client } from '@temporalio/client';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({
    connection,
  });

  const wfs = await client.workflow.list({ query: 'WorkflowType="versioningExample"' });
  for await (const wf of wfs) {
    const handle = await client.workflow.getHandle(wf.workflowId, wf.runId);
    await handle.signal('proceed', 'go');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
