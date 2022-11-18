export async function sendPushNotification(message: string): Promise<void> {
  if (Math.random() > 0.5) {
    throw new Error('Failed to send push notification')
  }

  console.log('Sent push notification:', message)
}
