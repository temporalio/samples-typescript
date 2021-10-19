import { createActivityHandle } from '@temporalio/workflow';
import type * as activities from './activities';

const { logTime } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that simply calls an activity */
export async function scheduledWorkflow(name: string): Promise<void> {
  await logTime(name, '' + Date.now());
}
