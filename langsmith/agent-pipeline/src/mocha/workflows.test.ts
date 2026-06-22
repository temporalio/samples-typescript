// Tracing is off by default; enable it before the plugin is constructed.
process.env.LANGSMITH_TRACING = 'true';

import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { Client } from '@temporalio/client';
import { Client as LangSmithClient } from 'langsmith';
import { traceable } from 'langsmith/traceable';
import { LangSmithPlugin } from '@temporalio/langsmith';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import * as activities from '../activities';
import { ResearchWorkflow } from '../workflows';

interface CollectedRun {
  id: string;
  name: string;
  parent_run_id?: string;
}

class InMemoryRunCollector {
  readonly createOrder: string[] = [];
  readonly byId = new Map<string, CollectedRun>();

  createRun = async (run: Record<string, unknown>): Promise<void> => {
    const id = String(run.id);
    if (!this.byId.has(id)) {
      this.createOrder.push(id);
      this.byId.set(id, { id, name: String(run.name) });
    }
    this.byId.set(id, { ...this.byId.get(id)!, ...(run as Partial<CollectedRun>), id });
  };

  updateRun = async (id: string, update: Record<string, unknown>): Promise<void> => {
    const existing = this.byId.get(id);
    if (existing) {
      this.byId.set(id, { ...existing, ...(update as Partial<CollectedRun>), id });
    }
  };

  awaitPendingTraceBatches = async (): Promise<void> => {};

  byName(name: string): CollectedRun | undefined {
    for (const id of this.createOrder) {
      const run = this.byId.get(id)!;
      if (run.name === name) {
        return run;
      }
    }
    return undefined;
  }

  parentNameOf(name: string): string | undefined {
    const run = this.byName(name);
    if (!run?.parent_run_id) {
      return undefined;
    }
    return this.byId.get(run.parent_run_id)?.name;
  }

  asClient(): LangSmithClient {
    return this as unknown as LangSmithClient;
  }
}

describe('langsmith/agent-pipeline', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('threads the trace through workflow, activities, and a child workflow', async () => {
    const collector = new InMemoryRunCollector();
    const plugin = new LangSmithPlugin({ client: collector.asClient(), addTemporalRuns: true });
    const taskQueue = 'test-langsmith-agent-pipeline';

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
      plugins: [plugin],
    });

    const client = new Client({
      connection: testEnv.connection,
      namespace: testEnv.namespace,
      plugins: [plugin],
    });

    const pipeline = traceable(
      async () =>
        client.workflow.execute(ResearchWorkflow, {
          args: ['durable execution'],
          workflowId: 'test-langsmith-agent-pipeline-' + Date.now(),
          taskQueue,
        }),
      { name: 'research_pipeline' }
    );

    const result = await worker.runUntil(pipeline());

    assert.strictEqual(result, 'reviewed: report based on: facts about durable execution');

    assert.strictEqual(collector.parentNameOf('RunWorkflow:ResearchWorkflow'), 'research_pipeline');
    assert.strictEqual(collector.parentNameOf('RunActivity:gatherFacts'), 'RunWorkflow:ResearchWorkflow');
    assert.strictEqual(collector.parentNameOf('gather_llm_call'), 'RunActivity:gatherFacts');
    assert.strictEqual(collector.parentNameOf('write_llm_call'), 'RunActivity:writeReport');
    assert.strictEqual(collector.parentNameOf('RunWorkflow:ReviewWorkflow'), 'RunWorkflow:ResearchWorkflow');
    assert.strictEqual(collector.parentNameOf('review_llm_call'), 'RunActivity:reviewReport');
    assert.strictEqual(collector.parentNameOf('RunActivity:reviewReport'), 'RunWorkflow:ReviewWorkflow');
  });
});
