/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as wf from '@temporalio/workflow';
// // Only import the activity types
import type * as activities from './activities';

const { checkoutItem, canceledPurchase } = wf.proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

type PurchaseState = 'PURCHASE_PENDING' | 'PURCHASE_CONFIRMED' | 'PURCHASE_CANCELED';

export const cancelPurchase = wf.defineSignal('cancelPurchase');
export const purchaseStateQuery = wf.defineQuery<PurchaseState>('purchaseState');

// @@@SNIPSTART typescript-oneclick-buy
export async function OneClickBuy(itemId: string) {
  const itemToBuy = itemId;
  let purchaseState: PurchaseState = 'PURCHASE_PENDING';
  wf.setHandler(cancelPurchase, () => void (purchaseState = 'PURCHASE_CANCELED'));
  wf.setHandler(purchaseStateQuery, () => purchaseState);
  if (await wf.condition(() => purchaseState === 'PURCHASE_CANCELED', '5s')) {
    return await canceledPurchase(itemToBuy);
  } else {
    purchaseState = 'PURCHASE_CONFIRMED';
    return await checkoutItem(itemToBuy);
  }
}
// @@@SNIPEND
