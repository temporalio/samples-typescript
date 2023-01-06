import { Connection, Client } from '@temporalio/client'
import { getConnectionOptions, namespace } from './temporal-connection'

export async function connectToTemporal() {
  return new Client({
    connection: await Connection.connect(getConnectionOptions()).catch((err) => {
      console.error('Error connecting to Temporal Server: ', err)
      return undefined
    }),
    namespace,
  })
}
