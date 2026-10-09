import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { ApplicationFailure, CancelledFailure, Context } from '@temporalio/activity';
import { WorkflowFailedError } from '@temporalio/client';
import { nanoid } from 'nanoid';
import assert from 'assert';
import { promptBatch } from '../workflows';
import { OpenRouterRequest, OpenRouterResult } from '../shared';

describe('promptBatch workflow', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('collects results and skips prompts that fail with a non-retryable error', async () => {
    const taskQueue = 'test-openrouter-' + nanoid();
    const activities = {
      async callOpenRouter(request: OpenRouterRequest): Promise<OpenRouterResult> {
        if (request.prompt === 'bad') {
          throw ApplicationFailure.create({
            message: 'OpenRouter returned HTTP 400: bad request',
            type: 'OpenRouterHTTP400',
            nonRetryable: true,
          });
        }
        return {
          prompt: request.prompt,
          model: 'openai/gpt-4o-mini',
          answer: `Answer to: ${request.prompt}`,
          costUsd: 0.001,
          generationId: `gen-${request.prompt}`,
          cacheStatus: 'MISS',
        };
      },
    };

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
    });

    const result = await worker.runUntil(
      testEnv.client.workflow.execute(promptBatch, {
        args: [{ prompts: ['one', 'bad', 'two'], maxConcurrency: 2 }],
        workflowId: 'test-openrouter-' + nanoid(),
        taskQueue,
      }),
    );

    assert.deepStrictEqual(
      result.results.map((r) => r.prompt),
      ['one', 'two'],
    );
    assert.deepStrictEqual(result.skipped, [{ prompt: 'bad', reason: 'OpenRouterHTTP400' }]);
    assert.strictEqual(result.reportedCostUsd, 0.002);
    assert.strictEqual(result.unknownCostCount, 0);
  });

  it('counts prompts whose cost was unknown instead of treating them as free', async () => {
    const taskQueue = 'test-openrouter-' + nanoid();
    const activities = {
      async callOpenRouter(request: OpenRouterRequest): Promise<OpenRouterResult> {
        return {
          prompt: request.prompt,
          model: 'm',
          answer: 'ok',
          costUsd: request.prompt === 'known' ? 0.001 : null,
          generationId: `gen-${request.prompt}`,
          cacheStatus: '',
        };
      },
    };
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
    });
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(promptBatch, {
        args: [{ prompts: ['known', 'unknown'] }],
        workflowId: 'test-openrouter-' + nanoid(),
        taskQueue,
      }),
    );
    assert.strictEqual(result.reportedCostUsd, 0.001);
    assert.strictEqual(result.unknownCostCount, 1);
  });

  it('propagates Workflow cancellation instead of recording skipped prompts', async () => {
    const taskQueue = 'test-openrouter-' + nanoid();
    const activities = {
      async callOpenRouter(): Promise<OpenRouterResult> {
        // Block until cancelled, then surface the cancellation.
        await Context.current().cancelled;
        throw new Error('unreachable');
      },
    };
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
    });
    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(promptBatch, {
        args: [{ prompts: ['one', 'two'], maxConcurrency: 2 }],
        workflowId: 'test-openrouter-' + nanoid(),
        taskQueue,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      await handle.cancel();
      await assert.rejects(
        handle.result(),
        (err: unknown) => err instanceof WorkflowFailedError && err.cause instanceof CancelledFailure,
      );
    });
  });

  it('rejects a non-positive maxConcurrency', async () => {
    const taskQueue = 'test-openrouter-' + nanoid();
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: { callOpenRouter: async () => assert.fail('should not run') },
    });
    await assert.rejects(
      worker.runUntil(
        testEnv.client.workflow.execute(promptBatch, {
          args: [{ prompts: ['one'], maxConcurrency: 0 }],
          workflowId: 'test-openrouter-' + nanoid(),
          taskQueue,
        }),
      ),
      (err: unknown) => /maxConcurrency/.test(String((err as { cause?: Error }).cause?.message)),
    );
  });
});
