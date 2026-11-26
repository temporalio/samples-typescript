import { Hub } from './hub';

export type Activities = ReturnType<typeof createActivities>;
export function createActivities(hubInstance: Hub) {
  return {
    async localBroadcast(args: { roomId: string; event: unknown }) {
      hubInstance.broadcast(args.roomId, args.event);
    },
  };
}
