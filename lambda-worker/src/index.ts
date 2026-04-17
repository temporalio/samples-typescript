import { runWorker } from '@temporalio/lambda-worker';
import { applyDefaults } from '@temporalio/lambda-worker/otel';
import * as activities from './activities';
import { TASK_QUEUE } from './workflows';

export const handler = runWorker({ deploymentName: 'sdk-demo', buildId: 'v1' }, (config) => {
  config.workerOptions.taskQueue = TASK_QUEUE;
  config.workerOptions.workflowBundle = {
    codePath: require.resolve('./workflow-bundle.js'),
  };
  config.workerOptions.activities = activities;
  config.workerOptions.workerDeploymentOptions!.defaultVersioningBehavior = 'AUTO_UPGRADE';
  applyDefaults(config);
});
