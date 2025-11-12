import { randomUUID } from 'crypto';
import { setTimeout as delay } from 'timers/promises';
import { Client, Connection } from '@temporalio/client';
import type { WorkflowHandle } from '@temporalio/client';
import { toCanonicalString, WorkerDeploymentVersion } from '@temporalio/common';

import { DEPLOYMENT_NAME, TASK_QUEUE } from './constants';
import { doNextSignal } from './workflows-base';
import { loadClientConnectConfig } from '@temporalio/envconfig';

async function main(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  console.info('Waiting for v1 worker to appear. Run `npm run worker1` in another terminal.');
  await waitForWorkerAndMakeCurrent(client, '1.0');

  // Next we'll start two workflows, one which uses the `AutoUpgrade` behavior, and one which uses
  // `Pinned`. Importantly, note that when we start the workflows, we are using a workflow type
  // name which does *not* include the version number. We defined them with versioned names so
  // we could show changes to the code, but here when the client invokes them, we're demonstrating
  // that the client remains version-agnostic.
  const autoUpgradeHandle = await client.workflow.start('AutoUpgrading', {
    workflowId: `worker-versioning-versioning-autoupgrade_${randomUUID()}`,
    taskQueue: TASK_QUEUE,
  });

  const pinnedHandle = await client.workflow.start('Pinned', {
    workflowId: `worker-versioning-versioning-pinned_${randomUUID()}`,
    taskQueue: TASK_QUEUE,
  });

  console.info('Started auto-upgrading workflow: %s', autoUpgradeHandle.workflowId);
  console.info('Started pinned workflow: %s', pinnedHandle.workflowId);

  await advanceWorkflows(autoUpgradeHandle, pinnedHandle);

  console.info('Waiting for v1.1 worker to appear. Run `npm run worker1_1` in another terminal.');
  await waitForWorkerAndMakeCurrent(client, '1.1');

  await advanceWorkflows(autoUpgradeHandle, pinnedHandle);

  console.info('Waiting for v2 worker to appear. Run `npm run worker2` in another terminal.');
  await waitForWorkerAndMakeCurrent(client, '2.0');

  const pinnedHandle2 = await client.workflow.start('Pinned', {
    workflowId: `worker-versioning-versioning-pinned-2_${randomUUID()}`,
    taskQueue: TASK_QUEUE,
  });
  console.info('Started pinned workflow v2: %s', pinnedHandle2.workflowId);

  for (const handle of [autoUpgradeHandle, pinnedHandle, pinnedHandle2]) {
    await handle.signal(doNextSignal, 'conclude');
    await handle.result();
  }

  console.info('All workflows completed');
}

async function advanceWorkflows(autoHandle: WorkflowHandle, pinnedHandle: WorkflowHandle): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await autoHandle.signal(doNextSignal, 'do-activity');
    await pinnedHandle.signal(doNextSignal, 'some-signal');
    await delay(500);
  }
}

async function waitForWorkerAndMakeCurrent(client: Client, buildId: string): Promise<void> {
  const version: WorkerDeploymentVersion = { deploymentName: DEPLOYMENT_NAME, buildId };
  const namespace = client.options.namespace ?? 'default';

  // Wait for the worker deployment version to be visible
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const response = await client.workflowService.describeWorkerDeployment({
        namespace,
        deploymentName: DEPLOYMENT_NAME,
      });

      const isPresent = response.workerDeploymentInfo?.versionSummaries?.some((summary) => {
        return summary.version === toCanonicalString(version);
      });

      if (isPresent) {
        break;
      }
    } catch (err) {
      console.debug('Describe worker deployment failed, retrying: %s', (err as Error).message);
    }

    await delay(1000);
  }

  await client.workflowService.setWorkerDeploymentCurrentVersion({
    namespace,
    deploymentName: DEPLOYMENT_NAME,
    version: toCanonicalString(version),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
