import { randomUUID } from 'node:crypto';
import { WorkflowHandle } from '@temporalio/client';
import { createUpdateAndRespondWithWorkflowSignal, proxyWorkflow } from './workflow';

export async function updateWorkflow<Input, Output>(
  handle: WorkflowHandle,
  input: Input,
  proxyTaskQueue: string
): Promise<Output> {
  const proxyHandle = await handle.client.start(proxyWorkflow, {
    workflowId: `proxy-${randomUUID()}`,
    taskQueue: proxyTaskQueue,
  });
  const signal = createUpdateAndRespondWithWorkflowSignal<Input>();
  await handle.signal(signal, input, { workflowId: proxyHandle.workflowId });
  return (await proxyHandle.result()) as Output;
}
