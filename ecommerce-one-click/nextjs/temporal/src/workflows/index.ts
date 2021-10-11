import wf from '@temporalio/workflow';
// // Only import the activity types
import type * as activities from '../activities';

const { checkoutItem, canceledPurchase } = wf.createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

type PurchaseState = 'PURCHASE_PENDING' | 'PURCHASE_CONFIRMED' | 'PURCHASE_CANCELED';

export const cancelPurchase = wf.defineSignal('cancelPurchase');
export const purchaseState = wf.defineQuery<PurchaseState>('purchaseState');

export async function OneClickBuy(itemId: string) {
  let itemToBuy = itemId;
  let _purchaseState: PurchaseState = 'PURCHASE_PENDING';
  wf.setListener(purchaseState, () => _purchaseState);
  wf.setListener(cancelPurchase, () => {
    _purchaseState = 'PURCHASE_CANCELED';
  });
  await wf.condition('5s', () => _purchaseState !== 'PURCHASE_PENDING')
    .then(() => {
      if (_purchaseState === 'PURCHASE_CANCELED') {
        return canceledPurchase(itemToBuy);
      }
      _purchaseState = 'PURCHASE_CONFIRMED';
      return checkoutItem(itemToBuy);
    });
};
