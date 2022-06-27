// @@@SNIPSTART typescript-hello-workflow
import { proxyActivities } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that simply calls an activity */
export async function example(name: string): Promise<string> {
  return await greet(name);
}
// @@@SNIPEND

import { condition, defineSignal, setHandler, proxyLocalActivities } from '@temporalio/workflow';

const { refreshAccessTokenLocalActivity } = proxyLocalActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function weirdWorkflowLoop() {
  const tasks: any = [];
  let token: any = {};
  let refreshAccessTokenPromise: any;

  function hasPendingTasks() {
    return tasks.length > 0;
  }

  function refreshAccessToken() {
    if (refreshAccessTokenPromise === undefined) {
      refreshAccessTokenPromise = (async () => {
        if (token.status === 'unconfigured') {
          // FIXME: Make sure client has been notified
          return;
        }

        token = await refreshAccessTokenLocalActivity(); //NOTE: In the real Workflow this function is called with proxyLocalActivity

        tasks.push(() => {
          //this is just so the condition at the end of the main forloop unlocks
        });
      })();

      refreshAccessTokenPromise.catch(() => {
        // FIXME: Make sure client has been notified
        // FIXME: Handle error
      });

      refreshAccessTokenPromise.finally(() => {
        refreshAccessTokenPromise = undefined;
      });
    }
  }

  for (;;) {
    while (tasks.length) {
      const task = tasks.pop();
      await handleTask(task);
    }
    refreshAccessToken(); // intentionally not awaited
    // if (!token) refreshAccessToken();
    await condition(hasPendingTasks, '1m');
  }
}

async function handleTask(task: string) {
  console.log('performing task:', task);
  return new Promise((r) => setTimeout(r, 100));
}
