"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canceledPurchase = exports.checkoutItem = void 0;
// @@@SNIPSTART nodejs-hello-activity
async function checkoutItem(itemId) {
    return `checking out ${itemId}!`;
}
exports.checkoutItem = checkoutItem;
async function canceledPurchase(itemId) {
    return `canceled purchase ${itemId}!`;
}
exports.canceledPurchase = canceledPurchase;
// @@@SNIPEND
