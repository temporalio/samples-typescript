import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import assert from 'assert';
import * as activities from '../activities';
import { reasoningContent } from '../workflows';

describe('openai-agents/reasoning-content', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('returns the reasoning and content from the model response', async () => {
    const taskQueue = 'test-reasoning-content';
    const seenRequests: { model: string; prompt: string }[] = [];
    activities.setReasoningClientFactory(() => ({
      responses: {
        create: async (body) => {
          seenRequests.push({ model: body.model, prompt: body.input });
          return {
            output: [
              {
                type: 'reasoning',
                summary: [{ text: 'sqrt(841): 29 * 29 = 841, so the answer is 29.' }],
              },
              {
                type: 'message',
                content: [{ type: 'output_text', text: 'The square root of 841 is 29.' }],
              },
            ],
          };
        },
      },
    }));

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
    });

    const result = await worker.runUntil(
      testEnv.client.workflow.execute(reasoningContent, {
        args: ['What is the square root of 841?', 'fake-reasoning-model'],
        workflowId: 'test-reasoning-content-' + Date.now(),
        taskQueue,
      }),
    );

    assert.strictEqual(result.prompt, 'What is the square root of 841?');
    assert.strictEqual(result.reasoningContent, 'sqrt(841): 29 * 29 = 841, so the answer is 29.');
    assert.strictEqual(result.content, 'The square root of 841 is 29.');
    assert.deepStrictEqual(seenRequests, [
      { model: 'fake-reasoning-model', prompt: 'What is the square root of 841?' },
    ]);
  });
});
