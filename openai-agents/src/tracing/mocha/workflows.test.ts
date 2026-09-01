import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { addTraceProcessor } from '@openai/agents-core';
import assert from 'assert';
import { FakeModelProvider, textResponse, toolCallResponse } from './fake-model';
import { RecordingTracingProcessor } from '../recording-processor';
import { tracedAgent } from '../workflows';

describe('openai-agents/tracing custom TracingProcessor', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('captures agent and function spans emitted during the run', async () => {
    const taskQueue = 'test-tracing-custom';
    const recorder = new RecordingTracingProcessor();
    addTraceProcessor(recorder);

    const provider = new FakeModelProvider([
      toolCallResponse('add', { a: 42, b: 58 }),
      textResponse('42 plus 58 is 100.'),
    ]);
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new OpenAIAgentsPlugin({ modelProvider: provider, interceptorOptions: { addTemporalSpans: true } })],
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

    const result = await worker.runUntil(
      testEnv.client.workflow.execute(tracedAgent, {
        args: ['What is 42 plus 58?'],
        workflowId: 'test-tracing-custom-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, '42 plus 58 is 100.');

    assert.ok(recorder.traceIds.length >= 1, 'at least one trace should be recorded');
    assert.ok(recorder.spanTypes.includes('agent'), 'an agent span should be recorded');
    assert.ok(recorder.spanTypes.includes('function'), 'a function tool span should be recorded');
  });
});
