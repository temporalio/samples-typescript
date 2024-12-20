import { defineUpdate } from '@temporalio/workflow';

export interface TransactionReport {
  status: 'complete' | 'failed';
  finalAmount?: number;
}

export interface TransactionConfirmation {
  status: 'confirmed';
}

export const getTransactionConfirmation = defineUpdate<TransactionConfirmation, []>('get-transaction-confirmation');

export const taskQueue = 'early-return';
