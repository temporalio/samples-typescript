import { continueAsNew, proxyActivities, setHandler, sleep, workflowInfo } from '@temporalio/workflow';
import type { ActivitiesService } from '../activities/activities.service';
// Can't use `@app/shared` here because for some reason Temporal's Webpack
// build complains that "node_modules/@app/shared" doesn't exist in Jest.
import { getExchangeRatesQuery, ExchangeRates } from '../../../../libs/shared/src';

const { getExchangeRates } = proxyActivities<ActivitiesService>({
  startToCloseTimeout: '1 minute',
});

const maxNumEvents = 10000;

export async function exchangeRatesWorkflow(storedRates?: ExchangeRates): Promise<void> {
  let rates = storedRates;

  // Register a query handler that allows querying for the current rates
  setHandler(getExchangeRatesQuery, () => rates);

  while (workflowInfo().historyLength < maxNumEvents) {
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
