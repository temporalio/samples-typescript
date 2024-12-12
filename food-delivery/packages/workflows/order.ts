import {
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  ApplicationFailure,
  sleep,
  proxyActivities,
} from '@temporalio/workflow'
import { errorMessage, getProductById, Product } from '@fooddelivery/common'
import type * as activities from '@fooddelivery/activities'

export type OrderState = 'Charging card' | 'Paid' | 'Picked up' | 'Delivered' | 'Refunding' | 'Failed'

export interface OrderStatus {
  productId: number
  state: OrderState
  deliveredAt?: Date
}

export interface OrderStatusWithOrderId extends OrderStatus {
  orderId: string
}

export interface OrderStatusWithOrderIdDao {
  orderId: string
  productId: number
  state: OrderState
  deliveredAt?: string
}

export const pickedUpSignal = defineSignal('pickedUp')
export const deliveredSignal = defineSignal('delivered')
export const getStatusQuery = defineQuery<OrderStatus>('getStatus')

const { chargeCustomer, refundOrder, sendPushNotification } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1m',
  retry: {
    maximumInterval: '5s', // Just for demo purposes. Usually this should be larger.
  },
})

export async function order(productId: number): Promise<void> {
  const product = getProductById(productId)
  if (!product) {
    throw ApplicationFailure.create({ message: `Product ${productId} not found` })
  }

  let state: OrderState = 'Charging card'
  let deliveredAt: Date

  // setup Signal and Query handlers
  setHandler(pickedUpSignal, () => {
    if (state === 'Paid') {
      state = 'Picked up'
    }
  })

  setHandler(deliveredSignal, () => {
    if (state === 'Picked up') {
      state = 'Delivered'
      deliveredAt = new Date()
    }
  })

  setHandler(getStatusQuery, () => {
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
    state = 'Refunding'
    await refundAndNotify(
      product,
      '⚠️ No drivers were available to pick up your order. Your payment has been refunded.',
    )
    throw ApplicationFailure.create({ message: 'Not picked up in time' })
  }

  await sendPushNotification('🚗 Order picked up')

  const notDeliveredInTime = !(await condition(() => state === 'Delivered', '1 min'))
  if (notDeliveredInTime) {
    state = 'Refunding'
    await refundAndNotify(product, '⚠️ Your driver was unable to deliver your order. Your payment has been refunded.')
    throw ApplicationFailure.create({ message: 'Not delivered in time' })
  }

  await sendPushNotification('✅ Order delivered!')

  await sleep('1 min') // this could also be hours or even months

  await sendPushNotification(`✍️ Rate your meal. How was the ${product.name.toLowerCase()}?`)
}

async function refundAndNotify(product: Product, message: string) {
  await refundOrder(product)
  await sendPushNotification(message)
}
