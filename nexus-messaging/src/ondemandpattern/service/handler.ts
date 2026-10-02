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

  getLanguages: async (ctx, input: GetLanguagesInput) => {
    const client = temporalNexus.getClient();
    const handle = client.workflow.getHandle(getWorkflowId(input.userId));
    return await handle.query(getLanguagesQuery);
  },

  getLanguage: async (ctx, input: GetLanguageInput) => {
    const client = temporalNexus.getClient();
    const handle = client.workflow.getHandle(getWorkflowId(input.userId));
    return await handle.query(getLanguageQuery);
  },

  setLanguage: async (ctx, input: SetLanguageInput) => {
    const client = temporalNexus.getClient();
    const handle = client.workflow.getHandle(getWorkflowId(input.userId));
    return await handle.executeUpdate(setLanguageUpdate, { args: [input.language] });
  },

  approve: async (ctx, input: ApproveInput) => {
    const client = temporalNexus.getClient();
    const handle = client.workflow.getHandle(getWorkflowId(input.userId));
    await handle.signal(approveSignal);
  },
});
