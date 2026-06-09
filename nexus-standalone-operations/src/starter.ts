import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nanoid } from 'nanoid';
import { myNexusService } from './api';
import { ENDPOINT_NAME, NAMESPACE } from './shared';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection, namespace: NAMESPACE });

  // Create a typed NexusServiceClient bound to the endpoint and service.
  // The endpoint must be pre-created on the server (see README).
  const nexusClient = client.nexus.createServiceClient({
    endpoint: ENDPOINT_NAME,
    service: myNexusService,
  });

  // Start sync echo operation and await the result immediately.
  const echoResult = await nexusClient.executeOperation(
    myNexusService.operations.echo,
    { message: 'hello' },
    {
      id: `echo-${nanoid()}`,
      scheduleToCloseTimeout: '10s',
    },
  );
  console.log(`Echo result: ${echoResult.message}`);

  // Start async (workflow-backed) hello operation and get a NexusOperationHandle.
  const handle = await nexusClient.startOperation(
    myNexusService.operations.hello,
    { name: 'World' },
    {
      id: `hello-${nanoid()}`,
      scheduleToCloseTimeout: '10s',
    },
  );
  console.log(`\nStarted myNexusService.hello. Operation ID: ${handle.operationId}`);

  // Use the NexusOperationHandle to await the result of the operation.
  const helloResult = await handle.result();
  console.log(`myNexusService.hello result: ${helloResult.greeting}`);

  // List nexus operations.
  console.log('\nListing Nexus operations:');
  const query = `Endpoint="${ENDPOINT_NAME}"`;
  for await (const operation of client.nexus.list({ query })) {
    console.log(
      `  Operation ID: ${operation.operationId}, Operation: ${operation.operation}, Status: ${operation.status}`,
    );
  }

  // Count nexus operations.
  const count = await client.nexus.count(query);
  console.log(`\nTotal Nexus operations: ${count.count}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
