import * as nexus from 'nexus-rpc';
import { WorkflowRunOperationHandler, startWorkflow } from '@temporalio/nexus';
import { syncEchoService, asyncEchoService } from '../api';
import { EchoWorkflow } from './workflows';

export const syncHandler = nexus.serviceHandler(syncEchoService, { echo: async (_ctx, message) => message });

export const asyncHandler = nexus.serviceHandler(asyncEchoService, {
  echoAsync: new WorkflowRunOperationHandler(async (ctx, message: string) =>
    startWorkflow(ctx, EchoWorkflow, {
      // Reuse the request ID for retries; independent operations get separate executions.
      workflowId: `nexus-echo-${ctx.requestId}`,
      args: [message],
    }),
  ),
});
