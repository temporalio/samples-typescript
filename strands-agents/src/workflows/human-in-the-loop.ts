import {
  BeforeToolCallEvent,
  tool,
  type InterruptResponseContent,
  type InterruptResponseContentData,
} from '@strands-agents/sdk';
import { TemporalAgent } from '@temporalio/strands-agents';
import { condition, defineQuery, defineSignal, setHandler } from '@temporalio/workflow';
import { z } from 'zod';

export const hitlApproveSignal = defineSignal<[string]>('hitlApprove');
export const hitlPendingApprovalQuery = defineQuery<string | null>('hitlPendingApproval');

const deleteFile = tool({
  name: 'deleteFile',
  description: 'Delete a file at the given path.',
  inputSchema: z.object({ path: z.string() }),
  callback: ({ path }) => `deleted ${path}`,
});

export async function humanInTheLoop(prompt: string): Promise<string> {
  let approval: string | null = null;
  let pendingReason: string | null = null;

  setHandler(hitlApproveSignal, (response) => {
    approval = response;
  });
  setHandler(hitlPendingApprovalQuery, () => pendingReason);

  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    tools: [deleteFile],
  });

  agent.addHook(BeforeToolCallEvent, (event) => {
    if (event.toolUse.name !== 'deleteFile') return;
    const path = (event.toolUse.input as { path?: string }).path;
    const response = event.interrupt<string>({
      name: 'approval',
      reason: `approve delete of ${path}?`,
    });
    if (response !== 'approve') {
      event.cancel = 'denied';
    }
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
