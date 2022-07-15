import {
  WorkflowClient,
  WorkflowExecutionAlreadyStartedError,
} from '@temporalio/client';
import { counterWorkflow } from '../workflows';

export const temporalProviders = [
  {
    provide: 'COUNTER_WORKFLOW',
    useFactory: async () => {
      const client = new WorkflowClient();

      console.log('Start counter workflow');

      let handle;
      try {
        handle = await client.start(counterWorkflow, {
          args: [0],
          taskQueue: 'nest-test',
          workflowId: 'counter',
        });
      } catch (err) {
        if (err instanceof WorkflowExecutionAlreadyStartedError) {
          handle = await client.getHandle('counter');
        } else {
          throw err;
        }
      }

      console.log('Started counter ', handle);
      return handle;
    },
  },
];
