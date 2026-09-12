import { Message } from '@aws-sdk/client-sqs'
import { log, proxyActivities } from '@temporalio/workflow'
import type * as activities from './activities'
import type { SQSBody } from './activities'

export const { helloWorldActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10m',
  retry: {
    maximumAttempts: 3,
  },
})

// @@@SNIPSTART typescript-workflow-type
export async function helloWorld(message: Message): Promise<string> {
  if (!message.Body) {
    return ''
  }
  const body = JSON.parse(message.Body) as SQSBody
  log.info('Starting someActivity')
  await helloWorldActivity({
    correlationId: message.MessageId as string,
    request: body,
    sqsReceipt: message.ReceiptHandle!,
  })
  return 'finished!'
}
// @@@SNIPEND
