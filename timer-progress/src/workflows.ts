import * as wf from '@temporalio/workflow';

export const getProgress = wf.defineQuery<number>('getProgress');

export async function progress(): Promise<void> {
  let currentProgress = 0;

  wf.setHandler(getProgress, () => currentProgress);

  for (let i = 1; i <= 10; ++i) {
    await wf.sleep('1s');
    currentProgress += 10;
    console.log(`${i * 10}%`);
  }
}
