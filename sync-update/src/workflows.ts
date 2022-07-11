import * as wf from '@temporalio/workflow';
import * as updateWithActivity from './update-with-activity/workflow';
import * as updateWithProxyWorkflow from './update-with-workflow/workflow';

// Export for worker registration
export { proxyWorkflow } from './update-with-workflow/workflow';

export type UpdateMethod = 'activityResponse' | 'proxyWorkflow';

export async function updatableWorkflow(method: UpdateMethod) {
  const tasks =
    method === 'activityResponse'
      ? updateWithActivity.setUpdateHandler<string, string>()
      : updateWithProxyWorkflow.setUpdateHandler<string, string>();

  while (wf.taskInfo().historyLength < 2000) {
    await wf.condition(() => tasks.length > 0);
    for (;;) {
      const task = tasks.shift();
      if (task === undefined) break;
      const response = `Hello, ${task.input}!`;
      await task.respond(response);
    }
  }
  await wf.continueAsNew<typeof updatableWorkflow>(method);
}
