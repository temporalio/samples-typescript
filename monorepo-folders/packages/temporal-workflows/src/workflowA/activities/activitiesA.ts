import { log } from '@temporalio/activity';

type ActivityAInput = { name: string };

type ActivityAResult = { message: string };

export async function activityA({ name }: ActivityAInput): Promise<ActivityAResult> {
  log.info('hello from activityA', { name });
  return { message: `ActivityA result: A-${name}!` };
}
