// Tracing is off by default; enable it before the plugin is constructed.
process.env.LANGSMITH_TRACING = 'true';

import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { Client } from '@temporalio/client';
import { Client as LangSmithClient } from 'langsmith';
import { LangSmithPlugin } from '@temporalio/langsmith';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { ConversationWorkflow, complete, composeReply, handleMessage } from '../workflows';

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

describe('langsmith/message-handlers', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('nests handler-body traceables under the signal and update handler runs', async () => {
    const collector = new InMemoryRunCollector();
    const plugin = new LangSmithPlugin({ client: collector.asClient(), addTemporalRuns: true });
    const taskQueue = 'test-langsmith-message-handlers';

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [plugin],
    });

    const client = new Client({
      connection: testEnv.connection,
      namespace: testEnv.namespace,
      plugins: [plugin],
    });

    const log = await worker.runUntil(async () => {
      const handle = await client.workflow.start(ConversationWorkflow, {
        workflowId: 'test-langsmith-message-handlers-' + Date.now(),
        taskQueue,
      });
      await handle.signal(handleMessage, 'when is my order arriving?');
      await handle.executeUpdate(composeReply, { args: ['please send my tracking number'] });
      await handle.signal(complete);
      return handle.result();
    });

    assert.deepStrictEqual(log, ['intent:when is my order arriving?', 'reply:please send my tracking number']);

    assert.strictEqual(collector.parentNameOf('classify_intent'), 'HandleSignal:handle_message');
    assert.strictEqual(collector.parentNameOf('draft_reply'), 'HandleUpdate:compose_reply');
    assert.strictEqual(collector.byName('HandleQuery:__stack_trace'), undefined);
  });
});
