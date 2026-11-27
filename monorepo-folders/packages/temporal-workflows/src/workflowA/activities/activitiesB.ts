import { log } from '@temporalio/activity';

type ActivityBInput = { name: string };

type ActivityBResult = { message: string };

export async function activityB({ name }: ActivityBInput): Promise<ActivityBResult> {
  log.info('hello from activityB', { name });
  return { message: `ActivityB result: B-${name}!` };
}
