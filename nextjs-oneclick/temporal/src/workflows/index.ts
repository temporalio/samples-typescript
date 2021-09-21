import { Trigger, createActivityHandle, sleep } from '@temporalio/workflow';
// // Only import the activity types
import type * as activities from '../activities';

const { checkoutItem, canceledPurchase } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

type PurchaseState = 'PENDING' | 'CONFIRMED' | 'CANCELED'

export const OneClickBuy = (itemId: string) => {
  let itemToBuy = itemId
  let purchaseState: PurchaseState = 'PENDING'
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
        await Promise.race([
          cancelTrigger,
          sleep(30 * 1000) // 30 seconds
        ])
        return await checkoutItem(itemToBuy);
      } catch (err) {
        return await canceledPurchase(itemToBuy);
      }
    },
  };
};
