import { Product } from '@fooddelivery/common'
import { notificationService, paymentService } from './services'

type SendPushNotificationInput = { message: string }

export async function sendPushNotification({ message }: SendPushNotificationInput): Promise<void> {
  notificationService.sendNotification({ type: 'push', message })
}

export async function refundOrder(product: Product): Promise<void> {
  paymentService.refund(product.cents)
}

export async function chargeCustomer(product: Product): Promise<void> {
  paymentService.charge(product.cents)
}
