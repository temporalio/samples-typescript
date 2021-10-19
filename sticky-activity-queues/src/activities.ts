import * as fs from 'fs/promises';
import { createHash } from 'crypto';
import { Context } from '@temporalio/activity'

export function createNonStickyActivities(uniqueWorkerTaskQueue: string) {
  return {
    async getUniqueTaskQueue(): Promise<string> {
      return uniqueWorkerTaskQueue;
    },
  };
}

export function createStickyActivities() {
  return {
    async downloadFileToWorkerFileSystem(url: string, path: string): Promise<void> {
      console.log(`Downloading ${url} and saving to ${path}`);
      // Here's where the real download code goes
      const body = Buffer.from('downloaded body');
      await Context.current().sleep(3000);
      await fs.writeFile(path, body);
    },
    async workOnFileInWorkerFileSystem(path: string): Promise<void> {
      const content = await fs.readFile(path);
      const checksum = createHash('md5').update(content).digest('hex');
      await Context.current().sleep(3000);
      console.log(`Did some work on ${path}, checksum: ${checksum}`);
    },
    async cleanupFileFromWorkerFileSystem(path: string): Promise<void> {
      await Context.current().sleep(3000);
      console.log(`Removing ${path}`);
      await fs.rm(path);
    },
  };
}
