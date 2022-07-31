import {
  condition,
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import { IActivities } from './activities';

export const incrementSignal = defineSignal<[number]>('increment');
export const getValueQuery = defineQuery<number>('getValue');

const { persist } = proxyActivities<IActivities>({
  startToCloseTimeout: '30 seconds',
});

export async function counterWorkflow(initial: number): Promise<void> {
  let value = initial;

  setHandler(incrementSignal, async (val: number) => {
    console.log('Increment', val);
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
