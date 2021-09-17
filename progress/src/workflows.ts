import { Progress } from './interfaces';
import { sleep } from '@temporalio/workflow';

export const progress: Progress = function () {
  let progress = 0;

  return {
    async execute(): Promise<number> {
      for (let i = 0; i < 10; ++i) {
        progress += 10;
        await sleep(10);
      }

      return progress;
    },
    queries: {
      getProgress: () => progress,
    },
  };
};
