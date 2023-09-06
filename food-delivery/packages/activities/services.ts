import { ApplicationFailure, Context } from '@temporalio/activity'

export const notificationService = {
  sendNotification({ type, message }: { type: string; message: string }) {
    const { log } = Context.current()
    if (Math.random() < 0.7) {
      throw new Error(`Failed to send ${type} notification. Unable to reach notification service.`)
    }

    log.info('Sent notification', { type, message })
  },
}

export const paymentService = {
  charge(cents: number) {
    const { log } = Context.current()
    // In a real app, we would pass an idempotency token to the downstream service
    const _idempotencyToken = `${Context.current().info.workflowExecution.workflowId}-charge`
    if (cents >= 3500) {
      throw ApplicationFailure.create({ nonRetryable: true, message: 'Card declined: insufficient funds' })
    }
    if (Math.random() < 0.7) {
      throw new Error('Failed to charge. Unable to reach payment service.')
    }
    log.info('Charged', { cents })
  },

  refund(cents: number) {
    const { log } = Context.current()
    // In a real app, we would pass an idempotency token to the downstream service
    const _idempotencyToken = `${Context.current().info.workflowExecution.workflowId}-refund`
    if (Math.random() < 0.7) {
      throw new Error('Failed to refund. Unable to reach payment service.')
    }

    log.info('Refunded', { cents })
  },
}
