import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import * as activities from '../activities';
import assert from 'assert';
import { FakeModelProvider, textResponse, toolCallResponse } from './fake-model';
import { approvalWorkflow } from '../workflows';

describe('openai-agents/human-approval workflow scenarios', function () {
  this.timeout(60_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  async function makeWorker(taskQueue: string, responses: ReturnType<typeof textResponse>[]) {
    const provider = new FakeModelProvider(responses);
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
      plugins: [new OpenAIAgentsPlugin({ modelProvider: provider })],
      bundlerOptions: {
        webpackConfigHook: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            conditionNames: ['require', 'browser', 'default'],
          },
        }),
      },
    });
    return { worker, provider };
  }

  it('approvalWorkflow: interruption produced, approval signal triggers continueAsNew, resumed run completes', async () => {
    const taskQueue = 'test-human-approval';

    // Two model turns total across both workflow runs:
    //   Turn 1 (original run): model requests dangerousAction → needsApproval interruption
    //   Turn 2 (resumed run after continueAsNew): tool executed, result returned to model → final text
    const { worker } = await makeWorker(taskQueue, [
      toolCallResponse('dangerousAction', { reason: 'demo' }),
      textResponse('Action completed successfully.'),
    ]);

    const result = await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(approvalWorkflow, {
        args: [{}],
        workflowId: 'test-human-approval-' + Date.now(),
        taskQueue,
      });

      await handle.signal('approve');
      return handle.result();
    });

    assert.strictEqual(result, 'Action completed successfully.');
  });
});
