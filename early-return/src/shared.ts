import { defineUpdate } from '@temporalio/workflow';

export interface TransactionReport {
  id: string;
  status: 'complete' | 'failed';
  finalAmount?: number;
}

export interface TransactionConfirmation {
  id: string;
  status: 'confirmed';
}

export const getTransactionConfirmation = defineUpdate<TransactionConfirmation, []>('get-transaction-confirmation');

export const taskQueue = 'early-return';
