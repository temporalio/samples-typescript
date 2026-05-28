import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { fetchWeather } from '../activities/tools';
import { toolsWorkflow } from '../workflows';
import { StubModel, textTurn, toolCallTurn } from './stub-model';

describe('toolsWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('dispatches the in-workflow tool and the activity-as-tool', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: { fetchWeather },
      plugins: [
        new StrandsPlugin({
          models: {
            bedrock: () =>
              new StubModel([
                toolCallTurn('letterCounter', 'call_1', { word: 'strawberry', letter: 'r' }),
                toolCallTurn('fetchWeather', 'call_2', { city: 'San Francisco' }),
                textTurn('there are 3 Rs and it is sunny'),
              ]),
          },
        }),
      ],
    });

    const result = await worker.runUntil(
      client.workflow.execute(toolsWorkflow, {
        args: ['count r in strawberry and check the weather'],
        workflowId: 'test-tools',
        taskQueue,
      })
    );
    assert.equal(result, 'there are 3 Rs and it is sunny');
  });
});
