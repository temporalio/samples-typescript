import { hubInstance } from './hub';

export type Activities = ReturnType<typeof createActivities>;
export function createActivities(uniqueTaskQueue: string) {
  return {
    async getUniqueTaskQueue() {
      return uniqueTaskQueue;
    },

    async broadcastEvent(args: { event: unknown }) {
      hubInstance.broadcast(args.event);
    },

    async sendEvent(args: { clientId: string; event: unknown }) {
      hubInstance.send(args.clientId, args.event);
    },
  };
}
