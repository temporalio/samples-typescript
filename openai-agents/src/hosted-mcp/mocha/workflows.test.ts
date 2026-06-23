import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import assert from 'assert';
import { FakeModelProvider, textResponse } from './fake-model';
import { simple, approval, approvalDecision } from '../workflows';

describe('openai-agents/hosted-mcp workflow scenarios', function () {
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

  it('simple: agent carrying the hosted MCP tool runs and returns model text', async () => {
    const taskQueue = 'test-hosted-mcp-simple';
    const { worker, provider } = await makeWorker(taskQueue, [
      textResponse('The openai/codex project is a coding agent.'),
    ]);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(simple, {
        args: ['What does openai/codex do?'],
        workflowId: 'test-hosted-mcp-simple-' + Date.now(),
        taskQueue,
      }),
    );
    assert.strictEqual(result, 'The openai/codex project is a coding agent.');

    // The hosted MCP tool serializes as a hosted_tool named 'hosted_mcp'; asserting it
    // is present in the first request's tool list proves the agent was wired with it.
    const hostedTools = provider.model.requests[0]?.tools.filter((t) => t.name === 'hosted_mcp');
    assert.strictEqual(hostedTools?.length, 1, 'request should carry exactly one hosted_mcp tool');
  });

  it('approval: workflow consumes the approval signal, runs, and returns model text', async () => {
    const taskQueue = 'test-hosted-mcp-approval';
    const { worker, provider } = await makeWorker(taskQueue, [textResponse('Approved and answered.')]);

    const result = await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(approval, {
        args: ['What does openai/codex do?'],
        workflowId: 'test-hosted-mcp-approval-' + Date.now(),
        taskQueue,
      });
      // The workflow gates the run on the approval signal; without this the run never
      // starts, so a returned result proves the signal was received and consumed.
      await handle.signal(approvalDecision, true);
      return handle.result();
    });

    assert.strictEqual(result, 'Approved and answered.');

    const hostedTools = provider.model.requests[0]?.tools.filter((t) => t.name === 'hosted_mcp');
    assert.strictEqual(hostedTools?.length, 1, 'request should carry exactly one hosted_mcp tool');
  });
});
