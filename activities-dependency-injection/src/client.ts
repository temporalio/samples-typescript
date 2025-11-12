import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { dependencyWF } from './workflows';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const result = await client.workflow.execute(dependencyWF, {
    taskQueue: 'dependency-injection',
    workflowId: 'dependency-injection',
  });
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
