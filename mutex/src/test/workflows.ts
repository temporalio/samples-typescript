import { lockRequestSignal, lockAcquiredSignal } from '../workflows';
import * as workflow from '@temporalio/workflow';

export { currentWorkflowIdQuery, lockRequestSignal, lockAcquiredSignal, lockWorkflow } from '../workflows';

export const hasLockQuery = workflow.defineQuery<boolean>('hasLock');

export async function testLockWorkflow(lockWorkflowId: string, sleepForMS = 500) {
  const handle = workflow.getExternalWorkflowHandle(lockWorkflowId);

  const { workflowId } = workflow.workflowInfo();

  let releaseSignalName: string | null = null;
  workflow.setHandler(lockAcquiredSignal, (lockResponse) => {
    releaseSignalName = lockResponse.releaseSignalName;
  });
  workflow.setHandler(hasLockQuery, () => !!releaseSignalName);

  await handle.signal(lockRequestSignal, { timeoutMs: 1000, initiatorId: workflowId });
  await workflow.condition(() => !!releaseSignalName);

  await workflow.sleep(sleepForMS);

  if (!releaseSignalName) {
    return;
  }

  await handle.signal(releaseSignalName);
  releaseSignalName = null;
}
