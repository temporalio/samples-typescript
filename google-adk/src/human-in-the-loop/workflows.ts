import { LongRunningFunctionTool } from '@google/adk';
import {
  CancellationScope,
  CancelledFailure,
  condition,
  defineSignal,
  defineUpdate,
  setHandler,
} from '@temporalio/workflow';

type ApprovalInput = { decision: string };
type ApprovalResult = { decision: string };

export const approveSignal = defineSignal<[ApprovalInput]>('approve');
export const approveUpdate = defineUpdate<ApprovalResult, [ApprovalInput]>('approveUpdate');

export async function humanApproval(): Promise<ApprovalResult> {
  let result: string | undefined;

  setHandler(approveSignal, ({ decision: value }) => {
    result = value;
  });
  setHandler(approveUpdate, ({ decision: value }) => {
    result = value;
    return { decision: value };
  });

  const tool = new LongRunningFunctionTool({
    name: 'humanApproval',
    description: 'Wait for a human approval.',
    execute: async () => {
      await condition(() => result !== undefined);
      return result;
    },
  });

  try {
    const decision = (await tool.runAsync({ args: {}, toolContext: {} as never })) as string;
    return { decision };
  } catch (err) {
    if (CancellationScope.current().consideredCancelled) {
      throw new CancelledFailure('Workflow cancelled');
    }
    throw err;
  }
}
