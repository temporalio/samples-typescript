import { Connection, Client } from '@temporalio/client'
import { connectionOptions, namespace } from './temporal-connection'

export async function connectToTemporal() {
  return new Client({
    connection: await Connection.connect(connectionOptions),
    namespace,
  })
}
