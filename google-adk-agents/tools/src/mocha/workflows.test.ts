import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import * as activities from '../activities';
import { lookupWeather } from '../workflows';

describe('google-adk-agents/tools workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('lookupWeather: activityAsTool dispatches the registered Activity', async () => {
    const taskQueue = 'test-google-adk-tools';
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
      plugins: [new GoogleAdkPlugin()],
    });
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(lookupWeather, {
        args: ['Tokyo'],
        workflowId: 'test-google-adk-tools-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'The weather in Tokyo is warm and sunny, 17 degrees.');
  });
});
