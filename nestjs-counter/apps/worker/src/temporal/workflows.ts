import {
  continueAsNew,
  proxyActivities,
  setHandler,
  sleep,
} from '@temporalio/workflow';
import { ActivitiesService } from '../activities/activities.service';
// Can't use `@app/shared` here because for some reason Temporal's Webpack
// build complains that "node_modules/@app/shared" doesn't exist in Jest.
import {
  getExchangeRatesQuery,
  ExchangeRates,
} from '../../../../libs/shared/src';

const { getExchangeRates } = proxyActivities<ActivitiesService>({
  startToCloseTimeout: '1 minute',
});

const maxIterations = 10000;

export async function exchangeRatesWorkflow(
  storedRates: ExchangeRates | null = null,
): Promise<void> {
  let rates: ExchangeRates | null = storedRates;

  // Register a query handler that allows querying for the current rates
  setHandler(getExchangeRatesQuery, () => rates);

  for (let i = 0; i < maxIterations; ++i) {
    // Get the latest rates
    rates = await getExchangeRates();

    // Sleep until tomorrow at 12pm server time, and then get the rates again
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setHours(12, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await sleep(tomorrow.valueOf() - today.valueOf());
  }

  await continueAsNew<typeof exchangeRatesWorkflow>(rates);
}
