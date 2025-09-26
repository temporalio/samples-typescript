import { Worker } from '@temporalio/worker';
import workflowHistory from './workflow-history.json';
import path from 'path';

describe('Workflow history compatibility', () => {
  test('Workflow history is compatible', async () => {
    await Worker.runReplayHistory(
      {
        workflowsPath: require.resolve(path.join(__dirname, 'workflows.ts')),
      },
      workflowHistory
    );
  });
});
