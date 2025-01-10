import { Connection, Client } from '@temporalio/client';
import { example } from './workflows';
import { getEnv } from './helpers';

/**
 * Establish a Client connection to a Temporal cluster using TLS encryption,
 * with optional mTLS or API Key authentication.
 */
async function run() {
  const { address, namespace, serverNameOverride, serverRootCACertificate, clientCert, clientKey, apiKey, taskQueue } =
    await getEnv();

  const connection = await Connection.connect({
    address,
    tls: {
      serverNameOverride,
      serverRootCACertificate,
      clientCertPair: clientKey &&
        clientCert && {
          crt: clientCert,
          key: clientKey,
        },
    },
    apiKey,
  });
  const client = new Client({ connection, namespace });

  // Run example workflow and await its completion
  const result = await client.workflow.execute(example, {
    taskQueue,
    workflowId: `my-business-id-${Date.now()}`,
    args: ['Temporal'],
  });

  console.log(result); // Hello, Temporal!
}

run().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
