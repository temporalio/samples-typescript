import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import assert from 'assert';
import { FakeModelProvider, textResponse } from './fake-model';
import { researchWorkflow } from '../workflows';

describe('openai-agents/research-bot workflow', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('researchWorkflow: plans searches, runs them concurrently, synthesizes a report', async () => {
    const taskQueue = 'test-research-bot';

    const plan = {
      searches: [
        { reason: 'Surf conditions', query: 'best April surfing Caribbean' },
        { reason: 'Travel logistics', query: 'cheap flights Caribbean April' },
      ],
    };
    const summaryA = 'SUMMARY_A: Barbados has consistent April swell.';
    const summaryB = 'SUMMARY_B: April flights to the Caribbean are affordable.';
    const report = {
      shortSummary: 'A combined surf-and-travel overview.',
      markdownReport: `# Report\n\n${summaryA}\n\n${summaryB}`,
      followUpQuestions: ['Which island has the best board rental?'],
    };

    const provider = new FakeModelProvider([
      textResponse(JSON.stringify(plan)),
      textResponse(summaryA),
      textResponse(summaryB),
      textResponse(JSON.stringify(report)),
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

    const result = await worker.runUntil(
      testEnv.client.workflow.execute(researchWorkflow, {
        args: ['Caribbean surfing in April'],
        workflowId: 'test-research-bot-' + Date.now(),
        taskQueue,
      }),
    );

    // The synthesized report incorporates both search summaries.
    assert.ok(result.includes(summaryA), 'report should include first search summary');
    assert.ok(result.includes(summaryB), 'report should include second search summary');

    // One planner call, two search calls (one per planned query), one writer call.
    assert.strictEqual(provider.model.requests.length, 4, 'expected planner + 2 searches + writer model calls');
  });
});
