import type { Client } from '@temporalio/client';
import { Context } from '@temporalio/activity';
import { LockRequest, lockRequestSignal } from './shared';

export function createActivities(client: Client) {
  return {
    async signalWithStartLockWorkflow(resourceId: string, timeoutMs: number) {
      const req: LockRequest = {
        initiatorId: Context.current().info.workflowExecution.workflowId,
        timeoutMs,
      };
      await client.workflow.signalWithStart('lockWorkflow', {
        taskQueue: Context.current().info.taskQueue,
        workflowId: resourceId,
        signal: lockRequestSignal,
        signalArgs: [req],
      });
    },
    async useAPIThatCantBeCalledInParallel(sleepForMs: number): Promise<void> {
      // Fake an activity with a critical path that can't run in parallel
      await Context.current().sleep(sleepForMs);
    },
  };
}
