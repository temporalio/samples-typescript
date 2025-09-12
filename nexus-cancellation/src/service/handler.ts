// @@@SNIPSTART typescript-nexus-hello-service-handler
import { randomUUID } from 'crypto';
import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import { helloService, HelloInput, HelloOutput } from '../api';
import { helloWorkflow } from './workflows';

export const helloServiceHandler = nexus.serviceHandler(helloService, {
  hello: new temporalNexus.WorkflowRunOperationHandler<HelloInput, HelloOutput>(
    // WorkflowRunOperationHandler takes a function that receives the Operation's context and input.
    // That function can be used to validate and/or transform the input before passing it to
    // the Workflow, as well as to customize various Workflow start options as appropriate.
    // Call temporalNexus.startWorkflow() to actually start the Workflow from inside the
    // WorkflowRunOperationHandler's delegate function.
    async (ctx, input: HelloInput) => {
      return await temporalNexus.startWorkflow(ctx, helloWorkflow, {
        args: [input],

        // Workflow IDs should typically be business-meaningful IDs and are used to dedupe workflow starts.
        // For this example, we're using the request ID allocated by Temporal when the caller workflow schedules
        // the operation, this ID is guaranteed to be stable across retries of this operation.
        workflowId: ctx.requestId ?? randomUUID(),

        // Task queue defaults to the task queue this Operation is handled on.
      });
    },
  ),
});
// @@@SNIPEND
