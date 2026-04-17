import { log, proxyActivities, setWorkflowOptions } from '@temporalio/workflow';
import type * as activities from './activities';

const { helloActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
});

export const TASK_QUEUE = 'serverless-task-queue-typescript';

export async function sampleWorkflow(name: string): Promise<string> {
  log.info('SampleWorkflow started', { name });
  const result = await helloActivity(name);
  log.info('SampleWorkflow completed', { result });
  return result;
}

setWorkflowOptions({ versioningBehavior: 'AUTO_UPGRADE' }, sampleWorkflow);
