import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import { nanoid } from 'nanoid';
import { EchoInput, EchoOutput, HelloInput, HelloOutput, myNexusService } from '../api';
import { helloWorkflow } from './workflows';

export const myNexusServiceHandler = nexus.serviceHandler(myNexusService, {
  echo: async (_ctx, input: EchoInput): Promise<EchoOutput> => {
    return {
      message: input.message,
    };
  },
  hello: new temporalNexus.WorkflowRunOperationHandler<HelloInput, HelloOutput>(async (ctx, input) => {
    return await temporalNexus.startWorkflow(ctx, helloWorkflow, {
      args: [input],
      workflowId: `hello-${nanoid()}`,
    });
  }),
});
