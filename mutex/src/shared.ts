import { defineQuery, defineSignal } from '@temporalio/workflow';

export interface LockRequest {
  initiatorId: string;
  timeoutMs: number;
}

interface LockResponse {
  releaseSignalName: string;
}

type CurrentWorkflowIdResult = { workflowId: string | null };

export const currentWorkflowIdQuery = defineQuery<CurrentWorkflowIdResult>('current-workflow-id');
export const lockRequestSignal = defineSignal<[LockRequest]>('lock-requested');
export const lockAcquiredSignal = defineSignal<[LockResponse]>('lock-acquired');
