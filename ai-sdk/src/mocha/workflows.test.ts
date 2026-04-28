import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { haikuAgent } from '../workflows';
import * as activities from '../activities';
import { AiSdkPlugin } from '@temporalio/ai-sdk';
import { openai } from '@ai-sdk/openai';
import assert from 'assert';

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const describeWorkflow = hasOpenAIKey ? describe : describe.skip;

describeWorkflow(hasOpenAIKey ? 'Example workflow' : 'Example workflow (skipped: OPENAI_API_KEY is not set)', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the Workflow', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      plugins: [new AiSdkPlugin({ modelProvider: openai })],
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
    });

    const result = await worker.runUntil(
      client.workflow.execute(haikuAgent, {
        args: ['Temporal'],
        workflowId: 'test',
        taskQueue,
      }),
    );
    assert.ok(result.length > 0);
  });
});
