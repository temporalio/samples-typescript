import { NativeConnection, Worker } from '@temporalio/worker'
import * as activities from '@fooddelivery/activities'
import { taskQueue } from '@fooddelivery/common'
import { namespace, getConnectionOptions } from '@fooddelivery/common/lib/temporal-connection'

async function run() {
  const connection = await NativeConnection.connect(getConnectionOptions())
  try {
    const worker = await Worker.create({
      workflowsPath: require.resolve('../../../packages/workflows/'),
      activities,
      connection,
      namespace,
      taskQueue,
    })

    await worker.run()
  } finally {
    // Close the connection once the worker has stopped
    await connection.close()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
