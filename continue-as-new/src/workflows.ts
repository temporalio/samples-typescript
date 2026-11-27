// @@@SNIPSTART typescript-continue-as-new-workflow
import { continueAsNew, sleep, log } from '@temporalio/workflow';

interface LoopingWorkflowInput {
  iteration?: number;
}

export async function loopingWorkflow({ iteration = 0 }: LoopingWorkflowInput = {}): Promise<void> {
  if (iteration === 10) {
    return;
  }
  log.info('Running Workflow iteration', { iteration });
  await sleep(1000);
  // Must match the arguments expected by `loopingWorkflow`
  await continueAsNew<typeof loopingWorkflow>({ iteration: iteration + 1 });
  // Unreachable code, continueAsNew is like `process.exit` and will stop execution once called.
}
// @@@SNIPEND
