import { ApplicationFailure, Context } from '@temporalio/activity'

export const notificationService = {
  sendNotification({ type, message }: { type: string; message: string }) {
    if (Math.random() < 0.7) {
      throw new Error(`Failed to send ${type} notification. Unable to reach notification service.`)
    }

    console.log(`Sent ${type} notification: ${message}`)
  },
}

export const paymentService = {
  charge(cents: number) {
    // In a real app, we would pass an idempotency token to the downstream service
    const _idempotencyToken = `${Context.current().info.workflowExecution.workflowId}-charge`
    if (cents >= 3500) {
      throw ApplicationFailure.create({ nonRetryable: true, message: 'Card declined: insufficient funds' })
    }
    if (Math.random() < 0.7) {
      throw new Error('Failed to charge. Unable to reach payment service.')
    }
    console.log(`Refunded $${cents / 100}`)
  },

  refund(cents: number) {
    // In a real app, we would pass an idempotency token to the downstream service
    const _idempotencyToken = `${Context.current().info.workflowExecution.workflowId}-refund`
    if (Math.random() < 0.7) {
      throw new Error('Failed to refund. Unable to reach payment service.')
    }

    console.log(`Refunded $${cents / 100}`)
  },
}
