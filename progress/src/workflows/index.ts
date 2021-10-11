import { sleep, defineQuery, setListener } from '@temporalio/workflow';

export const getProgress = defineQuery<number>('getProgress');

export async function Progress() {
  let progress = 0;
  setListener('progress', () => progress)
  for (let i = 0; i < 10; ++i) {
    progress += 10;
    await sleep(10);
  }
  return progress;
};
