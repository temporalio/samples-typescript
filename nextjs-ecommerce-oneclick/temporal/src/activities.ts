export async function checkoutItem(itemId: string): Promise<string> {
  return `checking out ${itemId}!`;
}
export async function canceledPurchase(itemId: string): Promise<string> {
  return `canceled purchase ${itemId}!`;
}
