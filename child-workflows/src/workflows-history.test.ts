import { Worker } from '@temporalio/worker';
import workflowHistory from './workflow-history.json';

describe('Workflow history compatibility', () => {
  test('Workflow history is compatible', async () => {
    await Worker.runReplayHistory(
      {
        workflowsPath: require.resolve('./workflows.ts'),
      },
      workflowHistory
    );
  });
});
