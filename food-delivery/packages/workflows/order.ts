import {
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  ApplicationFailure,
  sleep,
  proxyActivities,
} from '@temporalio/workflow'
import { getProductById } from 'common'
import type * as activities from 'activities'

type OrderState = 'Submitted' | 'Picked up' | 'Delivered'

export interface OrderStatus {
  state: OrderState
  deliveredAt?: Date
}

const pickedUp = defineSignal('pickedUp')
const delivered = defineSignal('delivered')
export const getStatus = defineQuery<OrderStatus>('getStatus')

const { sendPushNotification } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1m',
})

export async function order(productId: number): Promise<void> {
  const product = getProductById(productId)
  if (!product) {
    throw ApplicationFailure.create({ message: `Product ${productId} not found` })
  }

  let state: OrderState = 'Submitted'
  let deliveredAt: Date

  setHandler(pickedUp, () => {
    state = 'Picked up'
  })

  setHandler(delivered, () => {
    state = 'Delivered'
    deliveredAt = new Date()
  })

  setHandler(getStatus, () => {
    return { state, deliveredAt }
  })

  await condition(() => state === 'Picked up')
  await sendPushNotification('🚗 Order picked up')

  await condition(() => state === 'Delivered')
  await sendPushNotification('✅ Order delivered!')

  await sleep('1 hour')
  await sendPushNotification(`✍️ Rate your meal. How was ${product.name}?`)
}
