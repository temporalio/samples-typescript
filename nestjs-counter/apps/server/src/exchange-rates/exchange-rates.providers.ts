import {
  WorkflowClient,
  WorkflowExecutionAlreadyStartedError,
} from '@temporalio/client';
import { taskQueue } from '@app/shared';

export const exchangeRatesProviders = [
  {
    provide: 'EXCHANGE_RATES_WORKFLOW',
    useFactory: async () => {
      const client = new WorkflowClient();

      console.log('Starting exchange rates workflow!');

      let handle;
      try {
        handle = await client.start('exchangeRatesWorkflow', {
          taskQueue,
          workflowId: 'exchange-rates',
        });
      } catch (err) {
        if (err instanceof WorkflowExecutionAlreadyStartedError) {
          console.log('Reusing existing exchange rates workflow');
          handle = await client.getHandle('exchange-rates');
        } else {
          throw err;
        }
      }

      console.log('Started exchange rates workflow');
      return handle;
    },
  },
];
