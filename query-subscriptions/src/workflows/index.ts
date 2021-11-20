import * as wf from '@temporalio/workflow';
import { subscribableState } from './subscriptions';

export type State = number;

export async function counter(initialValue: number, iterations = 10): Promise<void> {
  const state = subscribableState<State>(initialValue);
  for (let i = 0; i < iterations; ++i) {
    await wf.sleep('1s');
    state.value += 10;
  }
}
