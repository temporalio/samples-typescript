import { SQSClient } from '@aws-sdk/client-sqs'
import 'dotenv/config'
import pinoLogger, { Logger } from 'pino'
import { z } from 'zod'

const envSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCOUNT_ID: z.string(),
  QUEUE_NAME: z.string(),
})

let fetchedEnvs: z.infer<typeof envSchema> | null = null

export const getEnv = () => {
  if (!fetchedEnvs) {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_ACCOUNT_ID, QUEUE_NAME } = process.env
    const envs = {
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_REGION,
      AWS_ACCOUNT_ID,
      QUEUE_NAME,
    }
    const result = envSchema.safeParse(envs)
    if (!result.success) {
      throw new Error(result.error.message)
    }
    fetchedEnvs = result.data
    return result.data
  }
  return fetchedEnvs
}

export const getQueueUrl = () => {
  const env = getEnv()
  return `https://sqs.${env.AWS_REGION}.amazonaws.com/${env.AWS_ACCOUNT_ID}/${env.QUEUE_NAME}`
}

let logger: Logger
export const getLogger = () => {
  if (!logger) {
    logger = pinoLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    })
  }
  return logger
}

export const getSQSClient = () => {
  const env = getEnv()
  const sqs = new SQSClient({
    region: env.AWS_REGION,
    ...(process.env.NODE_ENV === 'production' ?  {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    } : {}),
  })
  return sqs
}
