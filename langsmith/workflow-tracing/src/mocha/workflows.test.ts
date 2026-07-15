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
import { SummarizeWorkflow } from '../workflows';

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

  countByName(name: string): number {
    let n = 0;
    for (const id of this.createOrder) {
      if (this.byId.get(id)!.name === name) {
        n += 1;
      }
    }
    return n;
  }

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

describe('langsmith/workflow-tracing', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('emits each workflow-body traceable exactly once under replay, nesting sequentially', async () => {
    const collector = new InMemoryRunCollector();
    const plugin = new LangSmithPlugin({ client: collector.asClient() });
    const taskQueue = 'test-langsmith-workflow-tracing';

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [plugin],
      // Force replay on every Workflow Task so the replay-safety guarantee is exercised.
      maxCachedWorkflows: 0,
    });

    const client = new Client({
      connection: testEnv.connection,
      namespace: testEnv.namespace,
      plugins: [plugin],
    });

    const pipeline = traceable(
      async () =>
        client.workflow.execute(SummarizeWorkflow, {
          args: ['the meeting notes'],
          workflowId: 'test-langsmith-workflow-tracing-' + Date.now(),
          taskQueue,
        }),
      { name: 'user_pipeline', client: collector.asClient() },
    );

    const result = await worker.runUntil(pipeline());

    assert.strictEqual(result, 'summary:points:the meeting notes');

    assert.strictEqual(collector.countByName('extract_key_points'), 1);
    assert.strictEqual(collector.countByName('summarize'), 1);
    assert.strictEqual(collector.parentNameOf('extract_key_points'), 'user_pipeline');
    assert.strictEqual(collector.parentNameOf('summarize'), 'user_pipeline');
  });
});
