// @@@SNIPSTART typescript-update-workflow
import * as wf from '@temporalio/workflow';

export const fetchAndAdd = wf.defineUpdate<number, [number]>('fetchAndAdd');
export const done = wf.defineSignal('done');

export async function counter(): Promise<number> {
  let count = 0;
  let shouldExit = false;

  const validator = (arg: number) => {
    if (arg < 0) {
      throw new Error('Argument must not be negative');
    }
  };

  const handler = (arg: number) => {
    const prevCount = count;
    count += arg;
    return prevCount;
  };

  wf.setHandler(fetchAndAdd, handler, { validator });
  wf.setHandler(done, () => {
    shouldExit = true;
  });

  await wf.condition(() => shouldExit);
  return count;
}
// @@@SNIPEND
