// @@@SNIPSTART typescript-activity-complete-async
import { CompleteAsyncError, Context } from '@temporalio/activity';
import { AsyncCompletionClient } from '@temporalio/client';

export async function completeSomethingAsync(): Promise<string> {
  const taskToken = Context.current().info.taskToken;
  setTimeout(() => doSomeWork(taskToken), 1000);
  throw new CompleteAsyncError();
}

// this work could be done in a different process or on a different machine
async function doSomeWork(taskToken: Uint8Array): Promise<void> {
  const client = new AsyncCompletionClient();
  // does some work...
  await client.complete(taskToken, "Job's done!");
}
// @@@SNIPEND
