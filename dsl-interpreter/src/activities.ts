import { log } from '@temporalio/activity';

type Activity1Input = { arg1: string };
type Activity2Input = { arg: string };
type Activity3Input = { arg2: string; arg: string };
type Activity4Input = { result1: string };
type Activity5Input = { arg3: string; result4: string };
export type ActivityResult = { value: string };

export async function activity1({ arg1 }: Activity1Input): Promise<ActivityResult> {
  if (!arg1) throw new Error('arg1 is required');
  log.info('Executing activity1', { arg1 });
  return { value: `[result from activity1: ${arg1}]` };
}
export async function activity2({ arg }: Activity2Input): Promise<ActivityResult> {
  if (!arg) throw new Error('arg is required');
  log.info('Executing activity2', { arg });
  return { value: `[result from activity2: ${arg}]` };
}
export async function activity3({ arg2, arg }: Activity3Input): Promise<ActivityResult> {
  if (!arg2) throw new Error('arg2 is required');
  return {
    value: `activity3 received arg2: ${arg2}:

  And received: ${arg}`,
  };
}

export async function activity4({ result1 }: Activity4Input): Promise<ActivityResult> {
  if (!result1) throw new Error('result1 is required');
  log.info('Executing activity4', { result1 });
  return { value: `[result from activity4: ${result1}]` };
}

export async function activity5({ arg3, result4 }: Activity5Input): Promise<ActivityResult> {
  return {
    value: `activity5 received:
  arg3: ${arg3}:
  result4: ${result4}:`,
  };
}
