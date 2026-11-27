import { CancellationScope, defineSignal, setHandler } from '@temporalio/workflow';

type SetValueInput = { key: string; value: number };

export const setValueSignal = defineSignal<[SetValueInput]>('setValue');

// @@@SNIPSTART typescript-define-query
import { defineQuery } from '@temporalio/workflow';

type GetValueInput = { key: string };

type GetValueResult = { value?: number };

export const getValueQuery = defineQuery<GetValueResult, [GetValueInput]>('getValue');
// @@@SNIPEND

// @@@SNIPSTART typescript-handle-query
export async function trackState(): Promise<void> {
  const state = new Map<string, number>();
  setHandler(setValueSignal, ({ key, value }) => void state.set(key, value));
  setHandler(getValueQuery, ({ key }) => ({ value: state.get(key) }));
  await CancellationScope.current().cancelRequested;
}
// @@@SNIPEND
