import {
  condition,
  defineSignal,
  log,
  patched,
  proxyActivities,
  setHandler,
  setWorkflowOptions,
} from '@temporalio/workflow';
import type * as activities from './activities';

const { someActivity, someIncompatibleActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
});

export const doNextSignal = defineSignal<[string]>('do_next_signal');

setWorkflowOptions({ versioningBehavior: 'AUTO_UPGRADE' }, autoUpgradingWorkflowV1);
export async function autoUpgradingWorkflowV1(): Promise<void> {
  log.info('Changing workflow v1 started.');
  const signals: string[] = [];
  setHandler(doNextSignal, (signal: string) => {
    signals.push(signal);
  });

  while (true) {
    await condition(() => signals.length > 0);
    const nextSignal = signals.shift();
    if (!nextSignal) {
      continue;
    }

    if (nextSignal === 'do-activity') {
      log.info('Changing workflow v1 running activity');
      await someActivity('v1');
    } else if (nextSignal === 'conclude') {
      log.info('Concluding workflow v1');
      return;
    }
  }
}

setWorkflowOptions({ versioningBehavior: 'AUTO_UPGRADE' }, autoUpgradingWorkflowV1b);
export async function autoUpgradingWorkflowV1b(): Promise<void> {
  log.info('Changing workflow v1b started.');
  const signals: string[] = [];
  setHandler(doNextSignal, (signal: string) => {
    signals.push(signal);
  });

  while (true) {
    await condition(() => signals.length > 0);
    const nextSignal = signals.shift();
    if (!nextSignal) {
      continue;
    }

    if (nextSignal === 'do-activity') {
      log.info('Changing workflow v1b running activity');
      if (patched('DifferentActivity')) {
        await someIncompatibleActivity({ calledBy: 'v1b', moreData: 'hello!' });
      } else {
        await someActivity('v1b');
      }
    } else if (nextSignal === 'conclude') {
      log.info('Concluding workflow v1b');
      return;
    }
  }
}

setWorkflowOptions({ versioningBehavior: 'PINNED' }, pinnedWorkflowV1);
export async function pinnedWorkflowV1(): Promise<void> {
  log.info('Pinned workflow v1 started.');
  const signals: string[] = [];
  setHandler(doNextSignal, (signal: string) => {
    signals.push(signal);
  });

  while (true) {
    await condition(() => signals.length > 0);
    const nextSignal = signals.shift();
    if (nextSignal === 'conclude') {
      break;
    }
  }

  await someActivity('Pinned-v1');
}

setWorkflowOptions({ versioningBehavior: 'PINNED' }, pinnedWorkflowV2);
export async function pinnedWorkflowV2(): Promise<void> {
  log.info('Pinned workflow v2 started.');
  const signals: string[] = [];
  setHandler(doNextSignal, (signal: string) => {
    signals.push(signal);
  });

  await someActivity('Pinned-v2');

  while (true) {
    await condition(() => signals.length > 0);
    const nextSignal = signals.shift();
    if (nextSignal === 'conclude') {
      break;
    }
  }

  await someIncompatibleActivity({ calledBy: 'Pinned-v2', moreData: 'hi' });
}
