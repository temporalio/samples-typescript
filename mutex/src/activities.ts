import type { Client } from '@temporalio/client';
import { activityInfo, log, sleep } from '@temporalio/activity';
import { LockRequest, lockRequestSignal } from './shared';

type SignalWithStartLockInput = { resourceId: string; timeoutMs: number; taskQueue: string };
type SleepInput = { sleepForMs: number };
export type NotifyLockedInput = { resourceId: string; releaseSignalName: string };
export type NotifyUnlockedInput = { resourceId: string };

export function createActivities(client: Client) {
  return {
    async signalWithStartLockWorkflow({ resourceId, timeoutMs, taskQueue }: SignalWithStartLockInput) {
      const req: LockRequest = {
        initiatorId: activityInfo().workflowExecution!.workflowId,
        timeoutMs,
      };
      await client.workflow.signalWithStart('lockWorkflow', {
        taskQueue,
        workflowId: resourceId,
        signal: lockRequestSignal,
        signalArgs: [req],
      });
    },
    async useAPIThatCantBeCalledInParallel({ sleepForMs }: SleepInput): Promise<void> {
      // Fake an activity with a critical path that can't run in parallel
      await sleep(sleepForMs);
    },
    async notifyLocked({ resourceId, releaseSignalName }: NotifyLockedInput) {
      log.info('Locked', { resourceId, releaseSignalName });
    },
    async notifyUnlocked({ resourceId }: NotifyUnlockedInput) {
      log.info('Released lock', { resourceId });
    },
  };
}
