import { Connection, WorkflowClient } from '@temporalio/client';
import cuid from 'cuid';
import fs from 'fs';
import { Env, getEnv, isRemoteEnv } from './env';
import * as Workflows from './types/workflow-commands';
import { openAccount as openAccountWorkflow } from './workflows';
async function run(env: Env) {
  const connection = await createClientConnection(env);
  await connection.untilReady();

  const client = new WorkflowClient(connection.service, isRemoteEnv(env) ? { namespace: env.namespace } : {});

  // workflow params
  const openAccount: Workflows.OpenAccount = {
    accountId: cuid(),
    address: {
      address1: '123 Temporal Street',
      postalCode: '98006',
    },
    bankDetails: {
      accountNumber: cuid(),
      routingNumber: '1234555',
      accountType: 'Checking',
      personalOwner: {
        firstName: 'Bart',
        lastName: 'Simpson',
      },
    },
    bankId: 'Foo Bar Savings and Loan',
    clientEmail: 'bart@simpson.io',
  };

  // Here is how we start our workflow
  const handle = await client.start(openAccountWorkflow, {
    taskQueue: 'saga-demo',
    workflowId: 'saga-' + openAccount.accountId,
    args: [openAccount],
  });
  await handle.result();
}

run(getEnv()).catch((err) => {
  console.error('account failed to open', err);
  process.exit(1);
});

async function createClientConnection(env: Env) {
  if (!isRemoteEnv(env)) {
    return new Connection();
  }

  const { clientCertPath, clientKeyPath, address } = env;

  const crtBytes = fs.readFileSync(clientCertPath);
  const keyBytes = fs.readFileSync(clientKeyPath);

  return await new Connection({
    address: `${address}:7233`,
    tls: {
      // See docs for other TLS options
      clientCertPair: {
        crt: crtBytes,
        key: keyBytes,
      },
    },
  });
}
