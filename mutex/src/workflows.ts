import {
  condition,
  continueAsNew,
  defineSignal,
  getExternalWorkflowHandle,
  proxyActivities,
  setHandler,
  workflowInfo,
  uuid4,
} from '@temporalio/workflow';
import type * as activities from './activities';
import { LockRequest, currentWorkflowIdQuery, lockRequestSignal, lockAcquiredSignal } from './shared';

const { signalWithStartLockWorkflow, useAPIThatCantBeCalledInParallel } = proxyActivities<
  ReturnType<typeof activities['createActivities']>
>({
  startToCloseTimeout: '1 minute',
});

const MAX_WORKFLOW_HISTORY_LENGTH = 2000;

interface LockResponse {
  releaseSignalName: string;
}

export async function lockWorkflow(requests = Array<LockRequest>()): Promise<void> {
  let currentWorkflowId: string | null = null;
  setHandler(lockRequestSignal, (req: LockRequest) => {
    requests.push(req);
  });
  setHandler(currentWorkflowIdQuery, () => currentWorkflowId);
  while (workflowInfo().historyLength < MAX_WORKFLOW_HISTORY_LENGTH) {
    await condition(() => requests.length > 0);
    const req = requests.shift();
    // Check for `undefined` because otherwise TypeScript complans that `req`
    // may be undefined.
    if (req === undefined) {
      continue;
    }
    currentWorkflowId = req.initiatorId;
    const workflowRequestingLock = getExternalWorkflowHandle(req.initiatorId);
    const releaseSignalName = uuid4();

    // Send a unique secret `releaseSignalName` to the Workflow that acquired
    // the lock. The acquiring Workflow should signal `releaseSignalName` to
    // release the lock.
    await workflowRequestingLock.signal(lockAcquiredSignal, { releaseSignalName });
    let released = false;
    setHandler(defineSignal(releaseSignalName), () => {
      released = true;
    });

    // The lock is automatically released after `req.timeoutMs`, unless the
    // acquiring Workflow released it. This is to prevent deadlock.
    await condition(() => released, req.timeoutMs);
    currentWorkflowId = null;
  }
  // carry over any pending requests to the next execution
  if (requests.length > 0) {
    await continueAsNew<typeof lockWorkflow>(requests);
  }
}

export async function oneAtATimeWorkflow(resourceId: string, sleepForMs = 500, lockTimeoutMs = 1000): Promise<void> {
  let releaseSignalName = '';
  setHandler(lockAcquiredSignal, (lockResponse: LockResponse) => {
    releaseSignalName = lockResponse.releaseSignalName;
  });
  const hasLock = () => !!releaseSignalName;

  // Send a signal to the given lock Workflow to acquire the lock
  await signalWithStartLockWorkflow(resourceId, lockTimeoutMs);
  await condition(hasLock);

  console.log(`Locked using resource "${resourceId}", releaseSignalName: "${releaseSignalName}"`);

  // Simulate a potentially long-running critical path that can't be run
  // in parallel.
  await useAPIThatCantBeCalledInParallel(sleepForMs);

  // Send a signal to the given lock Workflow to release the lock
  const handle = getExternalWorkflowHandle(resourceId);
  await handle.signal(releaseSignalName);
  releaseSignalName = '';

  console.log(`Released lock for resource "${resourceId}"`);
}
