import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import { nexusGreetingService, GetLanguagesInput, GetLanguageInput, SetLanguageInput, ApproveInput } from '../api';
import { getLanguagesQuery, getLanguageQuery, setLanguageUpdate, approveSignal } from './workflows';

function workflowIdForUser(userId: string): string {
  return `GreetingWorkflow_for_${userId}`;
}

export const nexusGreetingServiceHandler = nexus.serviceHandler(nexusGreetingService, {
  getLanguages: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: GetLanguagesInput) {
      const handle = client.client.workflow.getHandle(workflowIdForUser(input.userId));
      const result = await handle.query(getLanguagesQuery);
      return temporalNexus.TemporalOperationResult.sync(result);
    },
  }),

  getLanguage: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: GetLanguageInput) {
      const handle = client.client.workflow.getHandle(workflowIdForUser(input.userId));
      const result = await handle.query(getLanguageQuery);
      return temporalNexus.TemporalOperationResult.sync(result);
    },
  }),

  setLanguage: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: SetLanguageInput) {
      const handle = client.getWorkflowHandle(workflowIdForUser(input.userId));
      return await handle.update(setLanguageUpdate, { args: [input.language] });
    },
  }),

  approve: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input: ApproveInput) {
      const handle = client.getWorkflowHandle(workflowIdForUser(input.userId));
      await handle.signal(approveSignal);
      return temporalNexus.TemporalOperationResult.sync(undefined);
    },
  }),
});
