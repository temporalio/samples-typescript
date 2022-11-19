import {
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  ApplicationFailure,
  sleep,
  proxyActivities,
} from '@temporalio/workflow'
import { errorMessage, getProductById, Product } from 'common'
import type * as activities from 'activities'

type OrderState = 'Charging card' | 'Paid' | 'Picked up' | 'Delivered'

export interface OrderStatus {
  productId: number
  state: OrderState
  deliveredAt?: Date
}

export const pickedUp = defineSignal('pickedUp')
export const delivered = defineSignal('delivered')
export const getStatus = defineQuery<OrderStatus>('getStatus')

const { chargeCustomer, refundOrder, sendPushNotification } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1m',
  retry: {
    maximumInterval: '5s',
  },
})

export async function order(productId: number): Promise<void> {
  // validate input
  const product = getProductById(productId)
  if (!product) {
    throw ApplicationFailure.create({ message: `Product ${productId} not found` })
  }

  // declare variables
  let state: OrderState = 'Charging card'
  let deliveredAt: Date

  // setup Signal and Query handlers
  setHandler(pickedUp, () => {
    if (state === 'Paid') {
      state = 'Picked up'
    }
  })

  setHandler(delivered, () => {
    if (state === 'Picked up') {
      state = 'Delivered'
      deliveredAt = new Date()
    }
  })

  setHandler(getStatus, () => {
    return { state, deliveredAt, productId }
  })

  // business logic
  try {
    await chargeCustomer(product)
  } catch (err) {
    const message = `Failed to charge customer for ${product.name}. Error: ${errorMessage(err)}`
    await sendPushNotification(message)
    throw ApplicationFailure.create({ message })
  }

  state = 'Paid'

  const notPickedUpInTime = !(await condition(() => state === 'Picked up', '1 min'))
  if (notPickedUpInTime) {
    await refundAndNotify(
      product,
      '⚠️ No drivers were available to pick up your order. Your payment has been refunded.'
    )
  }

  await sendPushNotification('🚗 Order picked up')

  const notDeliveredInTime = !(await condition(() => state === 'Delivered', '1 min'))
  if (notDeliveredInTime) {
    await refundAndNotify(product, '⚠️ Your driver was unable to deliver your order. Your payment has been refunded.')
  }

  await sendPushNotification('✅ Order delivered!')

  await sleep('1 hour')

  await sendPushNotification(`✍️ Rate your meal. How was ${product.name}?`)
}

async function refundAndNotify(product: Product, message: string) {
  await refundOrder(product)
  await sendPushNotification(message)
  throw ApplicationFailure.create({ message })
}
