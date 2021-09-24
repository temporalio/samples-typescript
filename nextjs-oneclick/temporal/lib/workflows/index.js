"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneClickBuy = void 0;
const workflow_1 = require("@temporalio/workflow");
const { checkoutItem, canceledPurchase } = (0, workflow_1.createActivityHandle)({
    startToCloseTimeout: '1 minute',
});
const OneClickBuy = (itemId) => {
    let itemToBuy = itemId;
    let purchaseState = 'PURCHASE_PENDING';
    const cancelTrigger = new workflow_1.Trigger();
    return {
        signals: {
            cancelPurchase(cancelReason) {
                cancelTrigger.reject(cancelReason);
            },
        },
        queries: {
            purchaseState() {
                return purchaseState;
            },
        },
        async execute() {
            try {
                purchaseState = 'PURCHASE_PENDING';
                await Promise.race([
                    cancelTrigger,
                    (0, workflow_1.sleep)(5 * 1000) // 5 seconds wait, adjust to taste
                ]);
                purchaseState = 'PURCHASE_CONFIRMED';
                return await checkoutItem(itemToBuy);
            }
            catch (err) {
                purchaseState = 'PURCHASE_CANCELED';
                return await canceledPurchase(itemToBuy);
            }
        },
    };
};
exports.OneClickBuy = OneClickBuy;
