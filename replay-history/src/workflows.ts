import * as wf from '@temporalio/workflow';

export const getValueQuery = wf.defineQuery<number>('getValue');
export const signals = {
  add: wf.defineSignal<[number]>('add'),
  sub: wf.defineSignal<[number]>('sub'),
  div: wf.defineSignal<[number]>('div'),
  mul: wf.defineSignal<[number]>('mul'),
  inverseFraction: wf.defineSignal<[]>('inverseFraction'),
};

export async function calculator(): Promise<void> {
  let value = 0;
  wf.setHandler(signals.add, (x: number) => {
    value += x;
  });
  wf.setHandler(signals.sub, (x: number) => {
    value -= x;
  });
  wf.setHandler(signals.div, (x: number) => {
    value /= x;
  });
  wf.setHandler(signals.mul, (x: number) => {
    value *= x;
  });
  wf.setHandler(signals.inverseFraction, () => {
    value = 1 / value;
  });
  wf.setHandler(getValueQuery, () => value);
  await wf.CancellationScope.current().cancelRequested;
}
