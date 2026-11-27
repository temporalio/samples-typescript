// @@@SNIPSTART typescript-activity-complete-async
import { CompleteAsyncError, activityInfo } from '@temporalio/activity';
import { Client } from '@temporalio/client';

type AsyncActivityResult = { message: string };

export async function doSomethingAsync(): Promise<AsyncActivityResult> {
  const taskToken = activityInfo().taskToken;
  setTimeout(() => doSomeWork(taskToken), 1000);
  throw new CompleteAsyncError();
}

// this work could be done in a different process or on a different machine
async function doSomeWork(taskToken: Uint8Array): Promise<void> {
  const client = new Client();
  // does some work...
  const result: AsyncActivityResult = { message: "Job's done!" };
  await client.activity.complete(taskToken, result);
}
// @@@SNIPEND
