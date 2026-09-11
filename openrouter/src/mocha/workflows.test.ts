import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { ApplicationFailure } from '@temporalio/activity';
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
    const taskQueue = 'test-openrouter-' + Date.now();
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
        workflowId: 'test-openrouter-' + Date.now(),
        taskQueue,
      }),
    );

    assert.deepStrictEqual(
      result.results.map((r) => r.prompt),
      ['one', 'two'],
    );
    assert.deepStrictEqual(result.skipped, [{ prompt: 'bad', reason: 'OpenRouterHTTP400' }]);
    assert.strictEqual(result.totalCostUsd, 0.002);
  });
});
