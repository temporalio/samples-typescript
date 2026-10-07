// @@@SNIPSTART aws-sqs-node
import { ReceiveMessageCommand } from '@aws-sdk/client-sqs'
import { Client, Connection } from '@temporalio/client'
import { Worker } from '@temporalio/worker'
import cluster from 'node:cluster'
import { availableParallelism } from 'node:os'
import process from 'node:process'
import * as activities from './activities'
import { getLogger, getQueueUrl, getSQSClient } from './utils'
import { helloWorld } from './workflows'
const sqs = getSQSClient()
const queueUrl =  getQueueUrl()
const logger = getLogger()

let temporalClient: Client
const getTemporalClient = async () => {
  if (!temporalClient) {
    const connection = await Connection.connect()
    temporalClient = new Client({
      connection,
    })
  }
  return temporalClient
}

async function pollQueue(): Promise<void> {
    const receiveMessageCommand = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['All'],
      VisibilityTimeout: 300,
      MaxNumberOfMessages: 10,
    })

    const data = await sqs.send(receiveMessageCommand)
    if (!data.Messages) {
      logger.info('No messages in queue')
      return
    }

    for (const message of data.Messages) {
      const { nanoid } = await import('nanoid')
      // keep in mind, you will have N temporal connections here, 
      // one for each poller
      const client = await getTemporalClient()
      logger.info({ message }, 'Starting workflow')
      await client.workflow.start(helloWorld, {
        args: [message],
        workflowId: nanoid(),
        // If a duplicate event might arrive after the Workflow started by the original event has completed, 
        // set this reuse policy to prevent duplicate Workflows:
        // workflowIdReusePolicy: WorkflowIdReusePolicy .WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
        taskQueue: 'hello-world-queue',
      })
    }
}

const runPoll = async () => {
  setInterval(pollQueue, 2000)
}

/**
 * This is the master process, it will fork two child processes
 * one for `runPoll()` and one for `temporalWorker.run()`
 * `nodeWorkers` is a map of worker id to worker type so that we can
 * have access to worker type in the worker process and respawn
 * the correct worker if it dies. 
 */
async function run() {
  const nodeWorkers = new Map<number, 'poller' | 'temporal'>()
  if (cluster.isPrimary) {
    const numCPUs = availableParallelism()
    // optional, this spawns pollers (node workers) based on available CPUs, and only 1 poller in dev
    for (let i = 0; i < (process.env.NODE_ENV === 'production' ? numCPUs - 1 : 1); i++) {
      const { id } = cluster.fork({ WORKER_TYPE: 'poller' }) // First child for runPoll()
      nodeWorkers.set(id, 'poller')
    }
    const { id } = cluster.fork({ WORKER_TYPE: 'temporal' }) // Second child for temporalWorker.run()
    nodeWorkers.set(id, 'temporal')

    cluster.on('exit', (worker, code, signal) => {
      // optional, you can remove this if you don't want to respawn node workers
      if (nodeWorkers.get(worker.id) === 'poller') {
        nodeWorkers.delete(worker.id)
        logger.info('Respawning poller worker...')
        const { id } = cluster.fork({ WORKER_TYPE: 'poller' })
        nodeWorkers.set(id, 'poller')
      } else if (nodeWorkers.get(worker.id) === 'temporal') {
        nodeWorkers.delete(worker.id)
        logger.info({ worker, signal, code }, `worker ${worker.process.pid} died, respawning...`)
        const { id } = cluster.fork({ WORKER_TYPE: 'temporal' })
        nodeWorkers.set(id, 'temporal')
      }
    })
  } else {
    // This is the child process from cluster.fork
    if (process.env.WORKER_TYPE === 'poller') {
      await runPoll()
    } else if (process.env.WORKER_TYPE === 'temporal') {
      const temporalWorker = await Worker.create({
        workflowsPath: require.resolve('./workflows'),
        taskQueue: 'hello-world-queue',
        activities,
      })
      await temporalWorker.run()
    }
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

// @@@SNIPEND
