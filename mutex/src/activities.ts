import { Context } from '@temporalio/activity';

export async function useAPIThatCantBeCalledInParallel(sleepForMs: number): Promise<void> {
  // Fake an activity with a critical path that can't run in parallel
  await Context.current().sleep(sleepForMs);
}
