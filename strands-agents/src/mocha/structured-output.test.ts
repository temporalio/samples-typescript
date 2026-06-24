import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { structuredOutputWorkflow } from '../workflows';
import { StubModel, toolCallTurn } from './stub-model';

describe('structuredOutputWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('returns the validated structured output', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';
    const person = { name: 'John Smith', age: 30, occupation: 'software engineer' };

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new StrandsPlugin({
          models: {
            bedrock: () => new StubModel([toolCallTurn('strands_structured_output', 'call_1', person)]),
          },
        }),
      ],
    });

    const result = await worker.runUntil(
      client.workflow.execute(structuredOutputWorkflow, {
        args: ['describe John'],
        workflowId: 'test-structured',
        taskQueue,
      })
    );
    assert.deepEqual(result, person);
  });
});
