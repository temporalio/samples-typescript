import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { v4 as uuid } from 'uuid';
import type { Result, User } from './types';
import { example } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  // @@@SNIPSTART typescript-ejson-client-setup
  const client = new Client({
    connection,
    dataConverter: { payloadConverterPath: require.resolve('./payload-converter') },
  });
  // @@@SNIPEND

  // @@@SNIPSTART typescript-ejson-client
  const user: User = {
    id: uuid(),
    // age: 1000n, BigInt isn't supported
    hp: Infinity,
    matcher: /.*Stormblessed/,
    token: Uint8Array.from([1, 2, 3]),
    createdAt: new Date(),
  };

  const handle = await client.workflow.start(example, {
    args: [user],
    taskQueue: 'ejson',
    workflowId: `example-user-${user.id}`,
  });
  // @@@SNIPEND

  console.log(`Started workflow ${handle.workflowId}`);

  const result: Result = await handle.result();
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
