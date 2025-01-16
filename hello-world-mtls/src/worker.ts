// @@@SNIPSTART typescript-mtls-worker
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { getEnv } from './helpers';

/**
 * Establish a Worker connection to a Temporal cluster using TLS encryption,
 * with optional mTLS or API Key authentication.
 */
async function run() {
  const { address, namespace, serverNameOverride, serverRootCACertificate, clientCert, clientKey, apiKey, taskQueue } =
    await getEnv();

  const connection = await NativeConnection.connect({
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
    apiKey: apiKey,
    metadata: {
      'temporal-namespace': namespace,
    },
  });

  try {
    const worker = await Worker.create({
      connection,
      namespace,
      workflowsPath: require.resolve('./workflows'),
      activities,
      taskQueue,
    });
    console.log('Worker connection successfully established');

    await worker.run();
  } finally {
    // Close the connection once the worker has stopped
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
