import {
  condition,
  continueAsNew,
  defineQuery,
  defineSignal,
  getExternalWorkflowHandle,
  setHandler,
  sleep,
  workflowInfo,
  uuid4,
} from '@temporalio/workflow';

interface LockRequest {
  initiatorId: string;
  timeoutMs: number;
}

interface LockResponse {
  releaseSignalName: string;
}

export const currentWorkflowIdQuery = defineQuery<string | null>('current-workflow-id');
export const hasLockQuery = defineQuery<boolean>('hasLock');
export const lockRequestSignal = defineSignal<[LockRequest]>('lock-requested');
export const lockAcquiredSignal = defineSignal<[LockResponse]>('lock-acquired');

export async function lockWorkflow(requests = Array<LockRequest>()): Promise<void> {
  let currentWorkflowId: string | null = null;
  setHandler(lockRequestSignal, (req: LockRequest) => {
    requests.push(req);
  });
  setHandler(currentWorkflowIdQuery, () => currentWorkflowId);
  while (workflowInfo().historyLength < 2000) {
    await condition(() => requests.length > 0);
    const req = requests.shift();
    if (req === undefined) {
      continue;
    }
    currentWorkflowId = req.initiatorId;
    const workflowRequestingLock = getExternalWorkflowHandle(req.initiatorId);
    const releaseSignalName = uuid4();
    await workflowRequestingLock.signal(lockAcquiredSignal, { releaseSignalName });
    let released = false;
    setHandler(defineSignal(releaseSignalName), () => {
      released = true;
    });
    await condition(() => released, req.timeoutMs);
    currentWorkflowId = null;
  }
  // carry over any pending requests to the next execution
  await continueAsNew<typeof lockWorkflow>(requests);
}

export async function testLockWorkflow(lockWorkflowId: string, sleepForMs = 500, lockTimeoutMs = 1000): Promise<void> {
  const handle = getExternalWorkflowHandle(lockWorkflowId);

  const { workflowId } = workflowInfo();

  let releaseSignalName: string | null = null;
  setHandler(lockAcquiredSignal, (lockResponse: LockResponse) => {
    releaseSignalName = lockResponse.releaseSignalName;
  });
  const hasLock = () => !!releaseSignalName;
  setHandler(hasLockQuery, hasLock);

  await handle.signal(lockRequestSignal, { timeoutMs: lockTimeoutMs, initiatorId: workflowId });
  await condition(hasLock);

  await sleep(sleepForMs);

  if (!releaseSignalName) {
    return;
  }

  await handle.signal(releaseSignalName);
  releaseSignalName = null;
}
