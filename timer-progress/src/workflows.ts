import * as wf from '@temporalio/workflow';

type ProgressResult = { percent: number };

export const getProgress = wf.defineQuery<ProgressResult>('getProgress');

export async function progress(): Promise<void> {
  let currentProgress = 0;

  wf.setHandler(getProgress, () => ({ percent: currentProgress }));

  for (let i = 1; i <= 10; ++i) {
    await wf.sleep('1s');
    currentProgress += 10;
    wf.log.info(`${i * 10}%`);
  }
}
