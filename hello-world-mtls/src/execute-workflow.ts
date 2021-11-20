// @@@SNIPSTART typescript-mtls-worker
import fs from 'fs';
import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';
import { getEnv, Env } from './mtls-env';

/**
 * Schedule a Workflow connecting with mTLS, configuration is provided via environment variables.
 * Note that serverNameOverride and serverRootCACertificate are optional.
 */
async function run({
  address,
  namespace,
  clientCertPath,
  clientKeyPath,
  serverNameOverride,
  serverRootCACertificatePath,
  taskQueue,
}: Env) {
  let serverRootCACertificate: Buffer | undefined = undefined;
  if (serverRootCACertificatePath) {
    serverRootCACertificate = fs.readFileSync(serverRootCACertificatePath);
  }
  const connection = new Connection({
    address,
    tls: {
      serverNameOverride,
      serverRootCACertificate,
      clientCertPair: {
        crt: fs.readFileSync(clientCertPath),
        key: fs.readFileSync(clientKeyPath),
      },
    },
  });
  await connection.untilReady();
  const client = new WorkflowClient(connection.service, { namespace });
  // Run example workflow and await its completion
  const result = await client.execute(example, { taskQueue, workflowId: 'my-business-id', args: ['Temporal'] });
  console.log(result); // Hello, Temporal!
}

run(getEnv()).then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
// @@@SNIPEND
