import { condition, defineSignal, proxyActivities, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

export const verifySignal = defineSignal<[]>('verify');

const { notifyHumanForVerification, collectFeedback } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function humanVerificationWorkflow(task: string) {
  let verified = false;

  await notifyHumanForVerification(task);
  setHandler(verifySignal, () => {
    verified = true;
  });

  await condition(() => verified);
  await sleep('1 day');
  await collectFeedback();
}
