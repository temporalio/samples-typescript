type PurchaseActivityInput = { itemId: string };
export type PurchaseResult = { message: string };

export async function checkoutItem({ itemId }: PurchaseActivityInput): Promise<PurchaseResult> {
  return { message: `checking out ${itemId}!` };
}

export async function canceledPurchase({ itemId }: PurchaseActivityInput): Promise<PurchaseResult> {
  return { message: `canceled purchase ${itemId}!` };
}
