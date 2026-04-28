// @@@SNIPSTART typescript-nexus-hello-service-handler
import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import { helloService, EchoInput, EchoOutput, HelloInput, HelloOutput } from '../api';
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
  echo: async (ctx, input: EchoInput): Promise<EchoOutput> => {
    // A simple async function can be used to defined a Synchronous Nexus Operation.
    // This is often sufficient for Operations that simply make arbitrary short calls to
    // other services or databases, or that perform simple computations such as this one.
    //
    // You may also access a Temporal Client by calling `temporalNexus.getClient()`.
    // That Client can be used to make arbitrary calls, such as signaling, querying,
    // or listing workflows.
    return input;
  },
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
// @@@SNIPEND
