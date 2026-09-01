import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import * as activities from '../activities';
import assert from 'assert';
import { FakeModelProvider, textResponse, toolCallResponse } from './fake-model';
import { agentHandoffs, handoffFunction, handoffWithFilter } from '../workflows';

describe('openai-agents/handoffs workflow scenarios', function () {
  this.timeout(30_000);

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
      activities,
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

  it('agentHandoffs: triage routes to billing specialist via Agent[] handoffs', async () => {
    const taskQueue = 'test-agent-handoffs';
    const { worker } = await makeWorker(taskQueue, [
      toolCallResponse('transfer_to_billing', {}),
      textResponse('Your invoice has been processed.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(agentHandoffs, {
        args: ['I have a billing question about my invoice.'],
        workflowId: 'test-agent-handoffs-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Your invoice has been processed.');
  });

  it('agentHandoffs: triage routes to support specialist via Agent[] handoffs', async () => {
    const taskQueue = 'test-agent-handoffs-support';
    const { worker } = await makeWorker(taskQueue, [
      toolCallResponse('transfer_to_support', {}),
      textResponse('Your support ticket has been filed.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(agentHandoffs, {
        args: ['I need help with a support issue.'],
        workflowId: 'test-agent-handoffs-support-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Your support ticket has been filed.');
  });

  it('handoffFunction: triage routes to billing specialist via handoff() function', async () => {
    const taskQueue = 'test-handoff-function';
    const { worker } = await makeWorker(taskQueue, [
      toolCallResponse('transfer_to_billing', {}),
      textResponse('Billing handled via handoff function.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(handoffFunction, {
        args: ['I have a billing question.'],
        workflowId: 'test-handoff-function-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Billing handled via handoff function.');
  });

  it('handoffWithFilter: filter drops newItems so specialist sees no handoff function_call_result', async () => {
    const taskQueue = 'test-handoff-with-filter';
    const { worker, provider } = await makeWorker(taskQueue, [
      toolCallResponse('transfer_to_billing', {}),
      textResponse('Billing answer after filtered handoff.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(handoffWithFilter, {
        args: ['I have a billing question.'],
        workflowId: 'test-handoff-with-filter-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'Billing answer after filtered handoff.');

    assert.strictEqual(provider.model.requests.length, 2, 'expected exactly two model requests');

    const specialistRequest = provider.model.requests[1]!;
    const inputItems = Array.isArray(specialistRequest.input) ? specialistRequest.input : [];
    const handoffResultItems = inputItems.filter(
      (item) => item.type === 'function_call_result' && (item as { name?: string }).name === 'transfer_to_billing',
    );
    assert.strictEqual(
      handoffResultItems.length,
      0,
      'filter should have removed the transfer_to_billing function_call_result from the specialist input',
    );
  });
});
