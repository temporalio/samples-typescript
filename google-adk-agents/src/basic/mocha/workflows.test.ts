import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmResponse } from '@google/adk';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { ActivityFailure, ApplicationFailure } from '@temporalio/common';
import { WorkflowFailedError } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { fakeModelProvider } from '@temporalio/google-adk-agents/testing';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { helloWorld } from '../workflows';

function failingModelProvider(): (model: string) => BaseLlm {
  class FailingLlm extends BaseLlm {
    override generateContentAsync(): AsyncGenerator<LlmResponse, void> {
      throw ApplicationFailure.nonRetryable('the model rejected the request');
    }

    override async connect(): Promise<BaseLlmConnection> {
      throw new Error('FailingLlm does not support connect().');
    }
  }
  return (model: string) => new FailingLlm({ model });
}

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

  it('helloWorld: a failed model call fails the Workflow rather than answering with an empty string', async () => {
    const taskQueue = 'test-google-adk-basic-model-failure';
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ modelProvider: failingModelProvider() })],
    });
    await worker.runUntil(
      assert.rejects(
        testEnv.client.workflow.execute(helloWorld, {
          args: ['Say hello.'],
          workflowId: taskQueue + '-' + Date.now(),
          taskQueue,
        }),
        (err: unknown) =>
          err instanceof WorkflowFailedError &&
          err.cause instanceof ActivityFailure &&
          err.cause.cause?.message === 'the model rejected the request',
      ),
    );
  });
});
