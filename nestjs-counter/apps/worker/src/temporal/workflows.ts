import { condition, proxyActivities, setHandler } from '@temporalio/workflow';
import { IActivities } from './activities';
import { incrementSignal, getValueQuery } from '@app/shared';

const { persist } = proxyActivities<IActivities>({
  startToCloseTimeout: '30 seconds',
});

export async function counterWorkflow(initial: number): Promise<void> {
  let value = initial;

  setHandler(incrementSignal, async (val: number) => {
    if (!val) {
      return;
    }
    value += val;

    await persist(value);
  });
  setHandler(getValueQuery, () => {
    return value;
  });

  await condition(() => false);
}
