import { defineQuery } from '@temporalio/workflow';

export const taskQueue = 'nest-test';

export type ExchangeRates = { [key: string]: number };

export const getExchangeRatesQuery = defineQuery<ExchangeRates | null>('getExchangeRates');

export type exchangeRatesWorkflowType = () => Promise<void>;
