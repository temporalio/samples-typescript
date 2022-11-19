import { Product } from 'common'
import { notificationService, paymentService } from './services'

export async function sendPushNotification(message: string): Promise<void> {
  notificationService.sendNotification({ type: 'push', message })
}

export async function refundOrder(product: Product): Promise<void> {
  paymentService.refund(product.price)
}

export async function chargeCustomer(product: Product): Promise<void> {
  paymentService.charge(product.price)
}
