import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import {
  ApproveInput,
  GetLanguageInput,
  GetLanguagesInput,
  nexusRemoteGreetingService,
  RunFromRemoteInput,
  RunFromRemoteOutput,
  SetLanguageInput,
} from '../api';
import { approveSignal, getLanguageQuery, getLanguagesQuery, greetingWorkflow, setLanguageUpdate } from './workflows';

const WORKFLOW_ID_PREFIX = 'GreetingWorkflow_for_';

function getWorkflowId(userId: string): string {
  return WORKFLOW_ID_PREFIX + userId;
}

export const nexusRemoteGreetingServiceHandler = nexus.serviceHandler(nexusRemoteGreetingService, {
  runFromRemote: new temporalNexus.WorkflowRunOperationHandler<RunFromRemoteInput, RunFromRemoteOutput>(
    async (ctx, input: RunFromRemoteInput) => {
      return await temporalNexus.startWorkflow(ctx, greetingWorkflow, {
        args: [],
        workflowId: getWorkflowId(input.userId),
      });
    },
  ),

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
      const handle = client.client.workflow.getHandle(getWorkflowId(input.userId));
      const result = await handle.executeUpdate(setLanguageUpdate, { args: [input.language] });
      return temporalNexus.TemporalOperationResult.sync(result);
    },
  }),

  approve: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: ApproveInput) {
      const handle = client.client.workflow.getHandle(getWorkflowId(input.userId));
      await handle.signal(approveSignal);
      return temporalNexus.TemporalOperationResult.sync(undefined);
    },
  }),
});
