import * as wf from '@temporalio/workflow';
import { CancellationScope, defineSignal, setHandler } from '@temporalio/workflow';

export const setValueSignal = defineSignal<[string, number]>('setValue');

// @@@SNIPSTART typescript-define-query
import { defineQuery } from '@temporalio/workflow';

export const getValueQuery = defineQuery<number | undefined, [string]>('getValue');
// @@@SNIPEND

// @@@SNIPSTART typescript-handle-query
export async function trackState(): Promise<void> {
  const state = new Map<string, number>();
  setHandler(setValueSignal, (key, value) => void state.set(key, value));
  setHandler(getValueQuery, (key) => state.get(key));
  await CancellationScope.current().cancelRequested;
}
// @@@SNIPEND
