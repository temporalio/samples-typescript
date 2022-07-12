import {
  condition,
  defineQuery,
  defineSignal,
  setHandler,
} from '@temporalio/workflow';

export const incrementSignal = defineSignal<[number]>('increment');
export const getValueQuery = defineQuery<number>('getValue');

export async function counterWorkflow(initial: number): Promise<void> {
  let value = initial;
  console.log('Started workflow', initial);

  setHandler(incrementSignal, (val: number) => {
    value += val;
  });
  setHandler(getValueQuery, () => {
    console.log('Query');
    return value;
  });

  await condition(() => false);
}
