import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import assert from 'assert';
import { FakeModelProvider, textResponse, toolCallResponse } from './fake-model';
import {
  deterministic,
  parallelization,
  llmAsJudge,
  agentsAsTools,
  inputGuardrail,
  outputGuardrail,
} from '../workflows';

describe('openai-agents/agent-patterns workflow scenarios', function () {
  this.timeout(60_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  async function makeWorker(taskQueue: string, responses: ReturnType<typeof textResponse>[]) {
    const provider = new FakeModelProvider(responses);
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new OpenAIAgentsPlugin({ modelProvider: provider })],
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
    return { worker, provider };
  }

  it('deterministic: runs three agents in sequence, each gating the next', async () => {
    const taskQueue = 'test-deterministic';
    const outlineText = 'Outline: Introduction, Body, Conclusion';
    const draftText = 'Draft: Here is the full draft.';
    const polishedText = 'Polished: Here is the final polished text.';
    const { worker, provider } = await makeWorker(taskQueue, [
      textResponse(outlineText),
      textResponse(draftText),
      textResponse(polishedText),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(deterministic, {
        args: ['Write about testing.'],
        workflowId: 'test-deterministic-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, polishedText);
    assert.strictEqual(provider.model.requests.length, 3, 'should have made exactly 3 model calls');
    const secondTurnInput = provider.model.requests[1]?.input;
    const secondTurnText = Array.isArray(secondTurnInput) ? JSON.stringify(secondTurnInput) : String(secondTurnInput);
    assert.ok(
      secondTurnText.includes(outlineText),
      'second agent input should contain the first agent output (outline)',
    );
  });

  it('parallelization: fans out to 3 agents concurrently then judge picks best', async () => {
    const taskQueue = 'test-parallelization';
    const answer1 = 'Technical answer: reliability.';
    const answer2 = 'Business answer: value delivery.';
    const answer3 = 'Creative answer: problem-solving mindset.';
    const judgeAnswer = answer1;
    const { worker, provider } = await makeWorker(taskQueue, [
      textResponse(answer1),
      textResponse(answer2),
      textResponse(answer3),
      textResponse(judgeAnswer),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(parallelization, {
        args: ['What is the most important skill?'],
        workflowId: 'test-parallelization-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, judgeAnswer);
    assert.strictEqual(provider.model.requests.length, 4, 'should have called model 3 times for agents + 1 for judge');
  });

  it('llmAsJudge: loops generate→judge until approved, returns approved output', async () => {
    const taskQueue = 'test-llm-as-judge';
    const firstDraft = 'First draft about Temporal.';
    const secondDraft = 'Improved draft about Temporal.';
    const { worker, provider } = await makeWorker(taskQueue, [
      textResponse(firstDraft),
      textResponse('REJECTED: needs more detail'),
      textResponse(secondDraft),
      textResponse('APPROVED'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(llmAsJudge, {
        args: ['Explain what Temporal is.'],
        workflowId: 'test-llm-as-judge-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, secondDraft);
    assert.strictEqual(
      provider.model.requests.length,
      4,
      'should have made 4 model calls: generate, judge-reject, generate, judge-approve',
    );
  });

  it('agentsAsTools: orchestrator calls specialist tool and returns final output', async () => {
    const taskQueue = 'test-agents-as-tools';
    const specialistAnswer = 'Specialist answer: durable execution ensures reliability.';
    const finalAnswer = 'Orchestrator synthesized: ' + specialistAnswer;
    const { worker, provider } = await makeWorker(taskQueue, [
      toolCallResponse('ask_specialist', { input: 'What are the benefits of durable execution?' }),
      textResponse(specialistAnswer),
      textResponse(finalAnswer),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(agentsAsTools, {
        args: ['What are the benefits of durable execution?'],
        workflowId: 'test-agents-as-tools-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, finalAnswer);
    const toolResults = provider.model.requests
      .flatMap((req) => (Array.isArray(req.input) ? req.input : []))
      .filter((item) => item.type === 'function_call_result' && item.name === 'ask_specialist');
    assert.strictEqual(toolResults.length, 1, 'ask_specialist tool result should reach the orchestrator exactly once');
  });

  it('inputGuardrail: blocks forbidden input before model is called', async () => {
    const taskQueue = 'test-input-guardrail-blocked';
    const { worker, provider } = await makeWorker(taskQueue, []);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(inputGuardrail, {
        args: ['This is a blocked request.'],
        workflowId: 'test-input-guardrail-blocked-' + Date.now(),
        taskQueue,
      }),
    );
    assert.ok(result.startsWith('BLOCKED:'), `expected BLOCKED sentinel, got: ${result}`);
    assert.ok(result.includes('keyword-guardrail'), 'sentinel should name the guardrail');
    assert.strictEqual(provider.model.requests.length, 0, 'model should not be called when input guardrail fires');
  });

  it('inputGuardrail: passes clean input through to model', async () => {
    const taskQueue = 'test-input-guardrail-pass';
    const modelReply = 'Here is something interesting about Temporal.';
    const { worker } = await makeWorker(taskQueue, [textResponse(modelReply)]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(inputGuardrail, {
        args: ['Tell me something interesting about Temporal.'],
        workflowId: 'test-input-guardrail-pass-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, modelReply);
  });

  it('outputGuardrail: blocks unsafe model output after model call', async () => {
    const taskQueue = 'test-output-guardrail';
    const { worker, provider } = await makeWorker(taskQueue, [textResponse('This response contains UNSAFE content.')]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(outputGuardrail, {
        args: ['Describe something.'],
        workflowId: 'test-output-guardrail-' + Date.now(),
        taskQueue,
      }),
    );
    assert.ok(result.startsWith('BLOCKED:'), `expected BLOCKED sentinel, got: ${result}`);
    assert.ok(result.includes('output-safety-guardrail'), 'sentinel should name the guardrail');
    assert.strictEqual(provider.model.requests.length, 1, 'model should be called once before output guardrail fires');
  });
});
