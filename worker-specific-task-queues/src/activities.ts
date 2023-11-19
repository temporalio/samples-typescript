/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Context } from '@temporalio/activity';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';

export function createNormalActivities(uniqueWorkerTaskQueue: string) {
  return {
    async getUniqueTaskQueue(): Promise<string> {
      return uniqueWorkerTaskQueue;
    },
  };
}
function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}
function tsleep(ms: number, cancelled: Promise<never>){
  let handle: NodeJS.Timeout;
  const timer = new Promise<void>((resolve) => {
    handle = setTimeout(resolve, ms);
  });
  return Promise.race([cancelled.finally(() => clearTimeout(handle)), timer]);
}
export function createActivitiesForSameWorker() {
  return {
    async downloadFileToWorkerFileSystem(url: string, path: string): Promise<void> {
      const { log } = Context.current();
      log.info('Downloading and saving', { url, path });
      // Here's where the real download code goes
      const body = Buffer.from('downloaded body');
      log.info("cancellation aware sleep");
      await tsleep(3000, Context.current().cancelled);
      await fs.writeFile(path, body);
    },
    async workOnFileInWorkerFileSystem(path: string): Promise<void> {
      const { log } = Context.current();
      const content = await fs.readFile(path);
      const checksum = createHash('md5').update(content).digest('hex');
      log.info("cancellation aware sleep");
      await tsleep(3000, Context.current().cancelled);
      log.info('Did some work', { path, checksum });
    },
    async cleanupFileFromWorkerFileSystem(path: string): Promise<void> {
      const { log } = Context.current();
      log.info("cancellation aware sleep");
      await tsleep(3000, Context.current().cancelled);
      log.info('Cleaning up temp file', { path });
      await fs.rm(path);
    },
  };
}
