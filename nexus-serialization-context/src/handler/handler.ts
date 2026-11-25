import * as nexus from 'nexus-rpc';
import { WorkflowRunOperationHandler, log, operationInfo, startWorkflow } from '@temporalio/nexus';
import { syncEchoService, asyncEchoService } from '../api';
import { EchoWorkflow } from './workflows';

export const syncHandler = nexus.serviceHandler(syncEchoService, {
  echo: async (_ctx, message) => {
    log.info('Handling sync echo', { endpoint: operationInfo().endpoint });
    return message;
  },
});

export const asyncHandler = nexus.serviceHandler(asyncEchoService, {
  echoAsync: new WorkflowRunOperationHandler(async (ctx, message: string) => {
    log.info('Starting async echo workflow', { endpoint: operationInfo().endpoint });
    return startWorkflow(ctx, EchoWorkflow, {
      // Reuse the request ID for retries. Independent operations get separate executions.
      workflowId: `nexus-echo-${ctx.requestId}`,
      args: [message],
    });
  }),
});
