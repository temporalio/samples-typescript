import { DeleteMessageCommand } from '@aws-sdk/client-sqs'
import { z } from 'zod'
import { getLogger, getQueueUrl, getSQSClient } from './utils'
const sqsBodySchema = z.object({
  message: z.string(),
})
export type SQSBody = z.infer<typeof sqsBodySchema>

const sqs = getSQSClient()
const queueUrl = getQueueUrl()
const deleteMessage = async (receiptHandle: string, logger: ReturnType<typeof getLogger>) => {
  const deleteMessageCommand = new DeleteMessageCommand({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle,
  })
  const deleteOutput = await sqs.send(deleteMessageCommand)
  logger.info(deleteOutput.$metadata, 'Message deleted successfully')
}

export async function helloWorldActivity({
  request,
  correlationId,
  sqsReceipt,
}: {
  request: SQSBody
  correlationId: string
  sqsReceipt: string
}): Promise<string> {
  const logger = getLogger().child({ correlationId })
  sqsBodySchema.parse(request)
  logger.info('Starting someActivity')
  await new Promise((resolve) => setTimeout(resolve, 1000))
  logger.info({ request })
  await new Promise((resolve) => setTimeout(resolve, 1000))
  logger.info('Finishing someActivity')
  await deleteMessage(sqsReceipt, logger)
  return 'finished!'
}
