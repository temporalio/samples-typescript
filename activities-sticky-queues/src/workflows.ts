import { createActivityHandle, uuid4 } from '@temporalio/workflow';
import type { createStickyActivities, createNonStickyActivities } from './activities';

// @@@SNIPSTART nodejs-sticky-queues-workflow
const { getUniqueTaskQueue } = createActivityHandle<ReturnType<typeof createNonStickyActivities>>({
  startToCloseTimeout: '1 minute',
});

export async function fileProcessingWorkflow(maxAttempts = 5): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; ++attempt) {
    try {
      const uniqueWorkerTaskQueue = await getUniqueTaskQueue();
      const act = createActivityHandle<ReturnType<typeof createStickyActivities>>({
        taskQueue: uniqueWorkerTaskQueue,
        // Note the use of scheduleToCloseTimeout.
        // The reason this timeout type is used if because this task queue is unique
        // to a single worker. When that worker goes away, there won't be a way for these
        // activities to progress.
        scheduleToCloseTimeout: '1 minute',
      });

      const downloadPath = `/tmp/${uuid4()}`;
      await act.downloadFileToWorkerFileSystem('https://temporal.io', downloadPath);
      try {
        await act.workOnFileInWorkerFileSystem(downloadPath);
      } finally {
        await act.cleanupFileFromWorkerFileSystem(downloadPath);
      }
      return;
    } catch (err) {
      if (attempt === maxAttempts) {
        console.log(`Final attempt (${attempt}) failed, giving up`);
        throw err;
      }

      console.log(`Attempt ${attempt} failed, retrying on a new Worker`);
    }
  }
}
// @@@SNIPEND
