import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { fakeModelProvider } from '@temporalio/google-adk-agents/testing';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { helloWorld } from '../workflows';

describe('google-adk-agents/basic workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('helloWorld: runs an LlmAgent through the runner with durable model calls', async () => {
    const taskQueue = 'test-google-adk-basic';
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ modelProvider: fakeModelProvider() })],
    });
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(helloWorld, {
        args: ['Say hello.'],
        workflowId: 'test-google-adk-basic-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'fake-response:gemini-2.5-flash');
  });
});
