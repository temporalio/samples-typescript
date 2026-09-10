import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import {
  ApproveInput,
  AttachApprovalContextInput,
  GetLanguageInput,
  GetLanguagesInput,
  nexusRemoteGreetingService,
  RunFromRemoteInput,
  RunFromRemoteOutput,
  SetLanguageInput,
} from '../api';
import {
  approveSignal,
  attachApprovalContextSignal,
  getLanguageQuery,
  getLanguagesQuery,
  greetingWorkflow,
  setLanguageUpdate,
} from './workflows';

const WORKFLOW_ID_PREFIX = 'GreetingWorkflow_for_';

function getWorkflowId(userId: string): string {
  return WORKFLOW_ID_PREFIX + userId;
}

export const nexusRemoteGreetingServiceHandler = nexus.serviceHandler(nexusRemoteGreetingService, {
  runFromRemote: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: RunFromRemoteInput) {
      return await client.startWorkflow(greetingWorkflow, {
        args: [],
        workflowId: getWorkflowId(input.userId),
        // attachApprovalContext may have created the GreetingWorkflow already, so attach to the
        // running execution instead of failing (the default behavior).
        workflowIdConflictPolicy: 'USE_EXISTING',
      });
    },
  }),

  getLanguages: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: GetLanguagesInput) {
      const handle = client.client.workflow.getHandle(getWorkflowId(input.userId));
      const result = await handle.query(getLanguagesQuery);
      return temporalNexus.TemporalOperationResult.sync(result);
    },
  }),

  getLanguage: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: GetLanguageInput) {
      const handle = client.client.workflow.getHandle(getWorkflowId(input.userId));
      const result = await handle.query(getLanguageQuery);
      return temporalNexus.TemporalOperationResult.sync(result);
    },
  }),

  setLanguage: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: SetLanguageInput) {
      const handle = client.getWorkflowHandle(getWorkflowId(input.userId));
      return await handle.update(setLanguageUpdate, { args: [input.language] });
    },
  }),

  approve: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: ApproveInput) {
      const handle = client.getWorkflowHandle(getWorkflowId(input.userId));
      await handle.signal(approveSignal);
      return temporalNexus.TemporalOperationResult.sync(undefined);
    },
  }),

  // Signals the Workflow, starting it first if it is not already running.
  attachApprovalContext: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: AttachApprovalContextInput) {
      await client.signalWithStartWorkflow<typeof greetingWorkflow, [AttachApprovalContextInput]>(greetingWorkflow, {
        args: [],
        workflowId: getWorkflowId(input.userId),
        signal: attachApprovalContextSignal,
        signalArgs: [input],
      });
      return temporalNexus.TemporalOperationResult.sync(undefined);
    },
  }),
});
