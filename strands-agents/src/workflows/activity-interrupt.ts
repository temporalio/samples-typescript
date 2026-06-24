// @@@SNIPSTART typescript-strands-activity-interrupt-workflow
import type { InterruptResponseContent, InterruptResponseContentData } from '@strands-agents/sdk';
import { TemporalAgent, workflow as strandsWorkflow } from '@temporalio/strands-agents';
import { condition, defineQuery, defineSignal, setHandler } from '@temporalio/workflow';

export const activityInterruptApproveSignal = defineSignal<[string]>('activityInterruptApprove');
export const activityInterruptPendingApprovalQuery = defineQuery<string | null>('activityInterruptPendingApproval');

export async function activityInterrupt(prompt: string): Promise<string> {
  let approval: string | null = null;
  let pendingReason: string | null = null;

  setHandler(activityInterruptApproveSignal, (response) => {
    approval = response;
  });
  setHandler(activityInterruptPendingApprovalQuery, () => pendingReason);

  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    tools: [
      strandsWorkflow.activityAsTool('deleteThing', {
        description: 'Delete a thing by name.',
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        activityOptions: { startToCloseTimeout: '30 seconds', retry: { maximumAttempts: 3 } },
      }),
    ],
  });

  let result = await agent.invoke(prompt);
  while (result.stopReason === 'interrupt') {
    const interrupts = result.interrupts ?? [];
    pendingReason = (interrupts[0]?.reason as string | undefined) ?? null;
    await condition(() => approval !== null);
    const response = approval!;
    approval = null;
    pendingReason = null;
    const responses: InterruptResponseContentData[] = interrupts.map((i) => ({
      type: 'interruptResponse',
      interruptResponse: { interruptId: i.id, response },
    }));
    result = await agent.invoke(responses as InterruptResponseContent[]);
  }
  return result.toString();
}
// @@@SNIPEND
