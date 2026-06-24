import { LongRunningFunctionTool } from '@google/adk';
import { condition, defineSignal, defineUpdate, setHandler } from '@temporalio/workflow';

export const approveSignal = defineSignal<[string]>('approve');
export const approveUpdate = defineUpdate<string, [string]>('approveUpdate');

export async function humanApproval(): Promise<string> {
  let result: string | undefined;

  setHandler(approveSignal, (value) => {
    result = value;
  });
  setHandler(approveUpdate, (value) => {
    result = value;
    return value;
  });

  const tool = new LongRunningFunctionTool({
    name: 'humanApproval',
    description: 'Wait for a human approval.',
    execute: async () => {
      await condition(() => result !== undefined);
      return result;
    },
  });

  const out = await tool.runAsync({ args: {}, toolContext: {} as never });
  return out as string;
}
