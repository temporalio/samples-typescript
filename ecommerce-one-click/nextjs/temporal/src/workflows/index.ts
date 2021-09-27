import { Trigger, createActivityHandle, sleep } from '@temporalio/workflow';
// // Only import the activity types
import type * as activities from '../activities';

const { checkoutItem, canceledPurchase } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

type PurchaseState = 'PURCHASE_PENDING' | 'PURCHASE_CONFIRMED' | 'PURCHASE_CANCELED'

export const OneClickBuy = (itemId: string) => {
  let itemToBuy = itemId
  let purchaseState: PurchaseState = 'PURCHASE_PENDING'
  const cancelTrigger = new Trigger<string>();
  return {
    signals: {
      cancelPurchase(cancelReason: string): void {
        cancelTrigger.reject(cancelReason);
      },
    },
    queries: {
      purchaseState(): null | PurchaseState {
        return purchaseState;
      },
    },
    async execute(): Promise<string> {
      try {
        purchaseState = 'PURCHASE_PENDING'
        await Promise.race([
          cancelTrigger,
          sleep(5 * 1000) // 5 seconds wait, adjust to taste
        ])
        purchaseState = 'PURCHASE_CONFIRMED'
        return await checkoutItem(itemToBuy);
      } catch (err) {
        purchaseState = 'PURCHASE_CANCELED'
        return await canceledPurchase(itemToBuy);
      }
    },
  };
};
