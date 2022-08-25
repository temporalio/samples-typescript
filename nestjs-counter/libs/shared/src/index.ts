import { defineQuery } from '@temporalio/workflow';

export const taskQueue = 'nest-test';

export const getExchangeRatesQuery = defineQuery<any>('getExchangeRates');
