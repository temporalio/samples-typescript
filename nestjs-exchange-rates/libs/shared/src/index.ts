import { defineQuery } from '@temporalio/workflow';

export const taskQueue = 'nest-test';

export type ExchangeRates = { [key: string]: number };

type GetExchangeRatesResult = { rates: ExchangeRates | null };

export const getExchangeRatesQuery = defineQuery<GetExchangeRatesResult>('getExchangeRates');

export type exchangeRatesWorkflowType = () => Promise<void>;
