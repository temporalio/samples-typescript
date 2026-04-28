import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import { helloService, HelloInput, HelloOutput } from '../api';
import { helloWorkflow } from './workflows';

/**
 * Creates a business-meaningful ID that is used to dedupe workflow starts
 * from the `helloService.hello` Nexus Operation.
 * 
 * @param input HelloInput
 * @returns A workflow ID derived from the Nexus Operation input.
 */
function workflowIdForHello(input: HelloInput): string {
  return `hello-${input.language}-${input.name}`;
}

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
        // For this example, the workflow handles the greeting request for a given person and language pair.
        workflowId: workflowIdForHello(input),

        // Task queue defaults to the task queue this Operation is handled on.
      });
    },
  ),
});
