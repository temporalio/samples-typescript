import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import assert from 'assert';
import { FakeModelProvider, textResponse, toolCallResponse } from './fake-model';
import { customerServiceWorkflow, processUserMessage, getHistory } from '../workflows';

describe('openai-agents/customer-service workflow', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('drives two updates, hands off to a specialist, and exposes history via query', async () => {
    const taskQueue = 'test-customer-service';

    // Turn 1: Triage hands off to the FAQ agent, which then answers.
    // Turn 2: the current agent is now FAQ, which answers directly.
    const provider = new FakeModelProvider([
      toolCallResponse('transfer_to_FAQ', {}),
      textResponse('You may bring one carry-on bag.'),
      textResponse('We offer free wifi; join Airline-Wifi.'),
    ]);

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

    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(customerServiceWorkflow, {
        workflowId: 'test-customer-service-' + Date.now(),
        taskQueue,
      });

      const reply1 = await handle.executeUpdate(processUserMessage, { args: ['What is the baggage allowance?'] });
      assert.strictEqual(reply1, 'You may bring one carry-on bag.');

      const reply2 = await handle.executeUpdate(processUserMessage, { args: ['Do you have wifi?'] });
      assert.strictEqual(reply2, 'We offer free wifi; join Airline-Wifi.');

      const history = await handle.query(getHistory);
      assert.ok(
        history.some((line) => line === 'Handed off from Triage to FAQ'),
        `expected a handoff line in history, got:\n${history.join('\n')}`,
      );
      assert.ok(history.includes('User: What is the baggage allowance?'));
      assert.ok(history.includes('FAQ: You may bring one carry-on bag.'));
      assert.ok(history.includes('User: Do you have wifi?'));
      assert.ok(history.includes('FAQ: We offer free wifi; join Airline-Wifi.'));
    });
  });
});
