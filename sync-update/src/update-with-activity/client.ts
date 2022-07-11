import { randomUUID } from 'node:crypto';
import { AsyncCompletionClient, WorkflowHandle, ConnectionLike } from '@temporalio/client';
import { fromPayloadsAtIndex, defaultPayloadConverter } from '@temporalio/common';
import { createUpdateAndRespondWithActivitySignal } from './workflow';

async function pollOnResult(connection: ConnectionLike, taskQueue: string): Promise<unknown> {
  const completionClient = new AsyncCompletionClient({ connection });
  // Arbitrarily wait for 10 seconds
  const activityTask = await connection.withDeadline(Date.now() + 10_000, () =>
    connection.workflowService.pollActivityTaskQueue({
      namespace: 'default',
      taskQueue: { name: taskQueue },
    })
  );
  // TODO: support full data converter and use provided one instead of default
  const result = fromPayloadsAtIndex(defaultPayloadConverter, 0, activityTask.input?.payloads);
  await completionClient.complete(activityTask.taskToken, undefined);
  return result;
}

export async function updateWorkflow<Input, Output>(
  handle: WorkflowHandle,
  input: Input,
  timeout = '1m'
): Promise<Output> {
  const signal = createUpdateAndRespondWithActivitySignal<Input>();
  const responseQueue = `response-${randomUUID()}`;
  await handle.signal(signal, input, {
    timeout,
    taskQueue: responseQueue,
  });
  return (await pollOnResult(handle.client.connection, responseQueue)) as Output;
}
