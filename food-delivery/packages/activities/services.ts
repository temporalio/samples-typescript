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
  charge(amount: number) {
    // In a real app, we would pass an idempotency token to the downstream service
    const _idempotencyToken = Context.current().info.workflowExecution.workflowId
    if (amount >= 35) {
      throw ApplicationFailure.create({ nonRetryable: true, message: 'Card declined: insufficient funds' })
    }
    if (Math.random() < 0.7) {
      throw new Error('Failed to charge. Unable to reach payment service.')
    }
    console.log(`Refunded $${amount}`)
  },

  refund(amount: number) {
    // In a real app, we would pass an idempotency token to the downstream service
    const _idempotencyToken = Context.current().info.workflowExecution.workflowId
    if (Math.random() < 0.7) {
      throw new Error('Failed to refund. Unable to reach payment service.')
    }

    console.log(`Refunded $${amount}`)
  },
}
