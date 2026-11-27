import { log, sleep } from '@temporalio/activity';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';

type UniqueTaskQueueResult = { taskQueue: string };

export function createNormalActivities(uniqueWorkerTaskQueue: string) {
  return {
    async getUniqueTaskQueue(): Promise<UniqueTaskQueueResult> {
      return { taskQueue: uniqueWorkerTaskQueue };
    },
  };
}

type WorkerFileInput = { path: string };
type DownloadFileInput = WorkerFileInput & { url: string };

export function createActivitiesForSameWorker() {
  return {
    async downloadFileToWorkerFileSystem({ url, path }: DownloadFileInput): Promise<void> {
      log.info('Downloading and saving', { url, path });
      // Here's where the real download code goes
      const body = Buffer.from('downloaded body');
      await sleep(3000);
      await fs.writeFile(path, body);
    },
    async workOnFileInWorkerFileSystem({ path }: WorkerFileInput): Promise<void> {
      const content = await fs.readFile(path);
      const checksum = createHash('md5').update(content).digest('hex');
      await sleep(3000);
      log.info('Did some work', { path, checksum });
    },
    async cleanupFileFromWorkerFileSystem({ path }: WorkerFileInput): Promise<void> {
      await sleep(3000);
      log.info('Cleaning up temp file', { path });
      await fs.rm(path);
    },
  };
}
