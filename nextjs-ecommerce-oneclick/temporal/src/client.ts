import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';

const client: Client = makeClient();

function makeClient(): Client {
  const config = loadClientConnectConfig();
  const connection = Connection.lazy(config.connectionOptions);
  return new Client({ connection });
}

export function getTemporalClient(): Client {
  return client;
}
