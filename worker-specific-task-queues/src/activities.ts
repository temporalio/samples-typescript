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

export function createActivitiesForSameWorker() {
  return {
    async downloadFileToWorkerFileSystem(url: string, path: string): Promise<void> {
      const { log, sleep } = Context.current();
      log.info(`Downloading ${url} and saving to ${path}`);
      // Here's where the real download code goes
      const body = Buffer.from('downloaded body');
      await sleep(3000);
      await fs.writeFile(path, body);
    },
    async workOnFileInWorkerFileSystem(path: string): Promise<void> {
      const { log, sleep } = Context.current();
      const content = await fs.readFile(path);
      const checksum = createHash('md5').update(content).digest('hex');
      await sleep(3000);
      log.info(`Did some work on ${path}, checksum: ${checksum}`);
    },
    async cleanupFileFromWorkerFileSystem(path: string): Promise<void> {
      const { log, sleep } = Context.current();
      await sleep(3000);
      log.info(`Removing ${path}`);
      await fs.rm(path);
    },
  };
}
