import * as wf from '@temporalio/workflow';
import { subscribableState } from './subscriptions';

export type State = number;

type CounterInput = {
  initialValue: number;
  iterations?: number;
};

export async function counter({ initialValue, iterations = 10 }: CounterInput): Promise<void> {
  const state = subscribableState<State>(initialValue);
  for (let i = 0; i < iterations; ++i) {
    await wf.sleep('1s');
    state.value += 10;
  }
}
