import type { Client } from '@temporalio/client';
import { activityInfo, log, sleep } from '@temporalio/activity';
import { LockRequest, lockRequestSignal } from './shared';

export function createActivities(client: Client) {
  return {
    async signalWithStartLockWorkflow(resourceId: string, timeoutMs: number) {
      const req: LockRequest = {
        initiatorId: activityInfo().workflowExecution.workflowId,
        timeoutMs,
      };
      await client.workflow.signalWithStart('lockWorkflow', {
        taskQueue: activityInfo().taskQueue,
        workflowId: resourceId,
        signal: lockRequestSignal,
        signalArgs: [req],
      });
    },
    async useAPIThatCantBeCalledInParallel(sleepForMs: number): Promise<void> {
      // Fake an activity with a critical path that can't run in parallel
      await sleep(sleepForMs);
    },
    async notifyLocked(resourceId: string, releaseSignalName: string) {
      log.info('Locked', { resourceId, releaseSignalName });
    },
    async notifyUnlocked(resourceId: string) {
      log.info('Released lock', { resourceId });
    },
  };
}
