import { SendMessageCommand } from '@aws-sdk/client-sqs'
import 'dotenv/config'
import { SQSBody } from './activities'
import { getLogger, getQueueUrl, getSQSClient } from './utils'
async function sendSQSFIFOMessages() {
  const sqs = getSQSClient()
  const queueUrl = getQueueUrl()
  const body: SQSBody = {
    message: 'Never gonna give you up, never gonna let you down',
  }
  const params = {
    MessageBody: JSON.stringify(body),
    QueueUrl: queueUrl,
    MessageGroupId: 'RickAstley',
    MessageDeduplicationId: (await import('nanoid')).nanoid(), // Required for FIFO queues
  }
  const logger = getLogger()
  try {
    const data = await sqs.send(new SendMessageCommand(params))
    logger.info({ messageId: data.MessageId }, 'Success')
  } catch (err) {
    logger.error(err instanceof Error ? err : JSON.stringify(err), 'Error')
  }
}

sendSQSFIFOMessages().catch((err) => {
  console.error(err)
  process.exit(1)
})
