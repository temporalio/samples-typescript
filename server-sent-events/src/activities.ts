import { Hub } from './hub';

export type Activities = ReturnType<typeof createActivities>;
export function createActivities(hubInstance: Hub) {
  return {
    async localBroadcast(args: { event: unknown }) {
      hubInstance.broadcast(args.event);
    },
  };
}
