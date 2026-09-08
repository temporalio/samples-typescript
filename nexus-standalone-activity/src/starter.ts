import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nanoid } from 'nanoid';
import { greetingService } from './api';
import { ENDPOINT_NAME } from './shared';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection, namespace: config.namespace ?? 'default' });

  const nexusClient = client.nexus.createServiceClient({
    endpoint: ENDPOINT_NAME,
    service: greetingService,
  });

  const result = await nexusClient.executeOperation(
    greetingService.operations.greet,
    { name: 'Temporal' },
    {
      id: nanoid(),
      scheduleToCloseTimeout: '10s',
    },
  );

  console.log(result.message);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
