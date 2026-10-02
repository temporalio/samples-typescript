import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import { nexusGreetingService, GetLanguagesInput, GetLanguageInput, SetLanguageInput, ApproveInput } from '../api';
import { getLanguagesQuery, getLanguageQuery, setLanguageUpdate, approveSignal } from './workflows';

function workflowIdForUser(userId: string): string {
  return `GreetingWorkflow_for_${userId}`;
}

export const nexusGreetingServiceHandler = nexus.serviceHandler(nexusGreetingService, {
  getLanguages: async (ctx, input: GetLanguagesInput) => {
    const client = temporalNexus.getClient();
    const handle = client.workflow.getHandle(workflowIdForUser(input.userId));
    return await handle.query(getLanguagesQuery);
  },

  getLanguage: async (ctx, input: GetLanguageInput) => {
    const client = temporalNexus.getClient();
    const handle = client.workflow.getHandle(workflowIdForUser(input.userId));
    return await handle.query(getLanguageQuery);
  },

  setLanguage: async (ctx, input: SetLanguageInput) => {
    const client = temporalNexus.getClient();
    const handle = client.workflow.getHandle(workflowIdForUser(input.userId));
    return await handle.executeUpdate(setLanguageUpdate, { args: [input.language] });
  },

  approve: async (ctx, input: ApproveInput) => {
    const client = temporalNexus.getClient();
    const handle = client.workflow.getHandle(workflowIdForUser(input.userId));
    await handle.signal(approveSignal);
  },
});
