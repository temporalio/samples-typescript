// @@@SNIPSTART typescript-lambda-worker-workflow
import { log, proxyActivities, setWorkflowOptions } from '@temporalio/workflow';
import type * as activities from './activities';

const { helloActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
});

export const TASK_QUEUE = 'serverless-task-queue-typescript';

type SampleWorkflowInput = { name: string };

export async function sampleWorkflow(input: SampleWorkflowInput): Promise<activities.HelloActivityResult> {
  log.info('SampleWorkflow started', { name: input.name });
  const result = await helloActivity(input);
  log.info('SampleWorkflow completed', { result: result.greeting });
  return result;
}

setWorkflowOptions({ versioningBehavior: 'PINNED' }, sampleWorkflow);
// @@@SNIPEND
