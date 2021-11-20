/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Patch } from 'immer';
import Redis from 'ioredis';
import { Context } from '@temporalio/activity';

export function createActivities(redis: Redis.Redis) {
  return {
    async publish(version: number, patches: Patch[]) {
      const { info } = Context.current();
      const patchArgs = patches.flatMap((diff, idx) => [`${idx}`, JSON.stringify(diff)]);
      await redis.xadd(info.workflowExecution.workflowId, version, ...patchArgs);
    },
  };
}
