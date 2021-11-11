import { proxyActivities } from '@temporalio/workflow';

const { greet } = proxyActivities({
  startToCloseTimeout: '1 minute',
});

/** A workflow that simply calls an activity */
export async function example(name) {
  return await greet(name);
}
