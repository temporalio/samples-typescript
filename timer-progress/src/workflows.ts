import * as wf from '@temporalio/workflow';

export const getProgress = wf.defineQuery<number>('getProgress');

export async function progress(): Promise<void> {
  let progress = 0;

  wf.setHandler(getProgress, () => progress);

  for (let i = 1; i <= 10; ++i) {
    await wf.sleep('1s');
    progress += 10;
    console.log(`${i * 10}%`);
  }
}
