import { log } from '@temporalio/activity';

type ActivityCInput = { name: string };
type ActivityDInput = { name: string };
type ActivityCResult = { message: string };
type ActivityDResult = { message: string };

export async function activityC({ name }: ActivityCInput): Promise<ActivityCResult> {
  log.info('hello from activityC', { name });
  return { message: `ActivityC result: C-${name}!` };
}

export async function activityD({ name }: ActivityDInput): Promise<ActivityDResult> {
  log.info('hello from activityD', { name });
  return { message: `ActivityD result: D-${name}!` };
}
