import {
  WorkflowClient,
  WorkflowExecutionAlreadyStartedError,
} from '@temporalio/client';
import { taskQueue } from '@app/shared';

export const exchangeRatesProviders = [
  {
    provide: 'WORKFLOW_CLIENT',
    useValue: new WorkflowClient(),
  },
  {
    provide: 'EXCHANGE_RATES_WORKFLOW_HANDLE',
    useFactory: async (client: WorkflowClient) => {
      let handle;
      try {
        handle = await client.start('exchangeRatesWorkflow', {
          taskQueue,
          workflowId: 'exchange-rates',
        });
        console.log('Started new exchange rates workflow');
      } catch (err) {
        if (err instanceof WorkflowExecutionAlreadyStartedError) {
          console.log('Reusing existing exchange rates workflow');
          handle = await client.getHandle('exchange-rates');
        } else {
          throw err;
        }
      }

      return handle;
    },
    inject: ['WORKFLOW_CLIENT'],
  },
];
