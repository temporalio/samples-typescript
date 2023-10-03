import { executeChild, proxyActivities, sleep, ApplicationFailure } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
  retry: {
    maximumAttempts: 3,
  },
});

export async function parentWorkflow(): Promise<string> {
  const numChildren = 1000;
  const childIndicies = [...Array(numChildren).keys()];
  const numActivities = 1000;
  const activityIndicies = [...Array(numActivities).keys()];
  await Promise.all(
    childIndicies
      .map((index) =>
        executeChild(childWorkflow, {
          args: [index.toString(), index % 10 == 0],
          retry: {
            maximumAttempts: 1,
          },
        }).catch((_) => null)
      )
      .concat(activityIndicies.map((index) => greet(`activity number ${index}`, index % 10 == 0).catch((_) => null)))
  );
  return '';
}

export async function childWorkflow(name: string, shouldFail: boolean): Promise<string> {
  await sleep('5 seconds');
  if (shouldFail) {
    throw new ApplicationFailure(`I am a child number ${name} and I failed!`);
  }
  return `I am a child number ${name}`;
}
