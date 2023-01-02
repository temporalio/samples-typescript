import * as workflow from '@temporalio/workflow';

interface LockRequest {
  initiatorId: string;
  timeoutMs: number;
}

interface LockResponse {
  releaseSignalName: string;
}

export const currentWorkflowIdQuery = workflow.defineQuery<string | null>('current-workflow-id');
export const hasLockQuery = workflow.defineQuery<boolean>('hasLock');
export const lockRequestSignal = workflow.defineSignal<[LockRequest]>('lock-requested');
export const lockAcquiredSignal = workflow.defineSignal<[LockResponse]>('lock-acquired');

export async function lockWorkflow(requests = Array<LockRequest>()): Promise<void> {
  let currentWorkflowId: string | null = null;
  workflow.setHandler(lockRequestSignal, (req: LockRequest) => {
    requests.push(req);
  });
  workflow.setHandler(currentWorkflowIdQuery, () => currentWorkflowId);
  while (workflow.workflowInfo().historyLength < 2000) {
    await workflow.condition(() => requests.length > 0);
    const req = requests.shift();
    if (req === undefined) {
      continue;
    }
    currentWorkflowId = req.initiatorId;
    const workflowRequestingLock = workflow.getExternalWorkflowHandle(req.initiatorId);
    const releaseSignalName = workflow.uuid4();
    await workflowRequestingLock.signal(lockAcquiredSignal, { releaseSignalName });
    let released = false;
    workflow.setHandler(workflow.defineSignal(releaseSignalName), () => {
      released = true;
    });
    await workflow.condition(() => released, req.timeoutMs);
    currentWorkflowId = null;
  }
  // carry over any pending requests to the next execution
  await workflow.continueAsNew<typeof lockWorkflow>(requests);
}

export async function testLockWorkflow(lockWorkflowId: string, sleepForMs = 500, lockTimeoutMs = 1000): Promise<void> {
  const handle = workflow.getExternalWorkflowHandle(lockWorkflowId);

  const { workflowId } = workflow.workflowInfo();

  let releaseSignalName: string | null = null;
  workflow.setHandler(lockAcquiredSignal, (lockResponse: LockResponse) => {
    releaseSignalName = lockResponse.releaseSignalName;
  });
  const hasLock = () => !!releaseSignalName
  workflow.setHandler(hasLockQuery, hasLock);

  await handle.signal(lockRequestSignal, { timeoutMs: lockTimeoutMs, initiatorId: workflowId });
  await workflow.condition(hasLock);

  await workflow.sleep(sleepForMs);

  if (!releaseSignalName) {
    return;
  }

  await handle.signal(releaseSignalName);
  releaseSignalName = null;
}
