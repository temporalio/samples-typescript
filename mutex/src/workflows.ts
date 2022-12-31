import * as workflow from '@temporalio/workflow';

interface LockRequest {
  initiatorId: string;
  timeoutMs: number;
}

interface LockResponse {
  releaseSignalName: string;
}

export const lockRequestSignal = workflow.defineSignal<[LockRequest]>('lock-requested');
export const lockAcquiredSignal = workflow.defineSignal<[LockResponse]>('lock-acquired');

export async function lockWorkflow(requests = Array<LockRequest>()) {
  workflow.setHandler(lockRequestSignal, (req: LockRequest) => {
    requests.push(req);
  });
  while (workflow.workflowInfo().historyLength < 2000) {
    await workflow.condition(() => requests.length > 0);
    const req = requests.shift();
    if (req === undefined) {
      continue;
    }
    const handle = workflow.getExternalWorkflowHandle(req.initiatorId);
    const releaseSignalName = workflow.uuid4();
    await handle.signal(lockAcquiredSignal, { releaseSignalName });
    let released = false;
    workflow.setHandler(workflow.defineSignal(releaseSignalName), () => {
      released = true;
    });
    await workflow.condition(() => released, req.timeoutMs);
  }
  // carry over any pending requests to the next execution
  await workflow.continueAsNew<typeof lockWorkflow>(requests);
}
