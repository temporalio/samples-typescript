import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { nanoid } from 'nanoid';
import { defaultPayloadConverter } from '@temporalio/common';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { DefaultLogger, Runtime, Worker } from '@temporalio/worker';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import * as realActivities from '../activities';
import type * as activities from '../activities';
import type * as llmActivities from '../llm-activities';
import { TOPIC_PROGRESS, TOPIC_STATUS, type StatusEvent } from '../shared';
import { closeSignal, hub, order, pipeline, ticker } from '../workflows';
import { llmStreaming } from '../workflows-llm';

// The unit tests below cover the workflow side only. The client subscribe path
// needs a real server, so it is exercised by the integration test at the end.
describe('workflow-streams workflows', function () {
  let env: TestWorkflowEnvironment;

  this.slow(10_000);
  this.timeout(30_000);

  before(async function () {
    // Filter INFO log messages for clearer test output
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.createTimeSkipping();
  });

  after(async () => {
    await env.teardown();
  });

  it('order returns the charge id', async () => {
    const mockActivities: typeof activities = {
      async chargeCard(orderId) {
        return `charge-${orderId}`;
      },
    };
    const taskQueue = `test-${nanoid()}`;
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: mockActivities,
    });
    const result = await worker.runUntil(
      env.client.workflow.execute(order, {
        args: [{ orderId: 'order-42' }],
        taskQueue,
        workflowId: `test-${nanoid()}`,
      }),
    );
    assert.equal(result, 'charge-order-42');
  });

  it('pipeline runs all stages to completion', async () => {
    const taskQueue = `test-${nanoid()}`;
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
    });
    const result = await worker.runUntil(
      env.client.workflow.execute(pipeline, {
        args: [{ pipelineId: 'p1' }],
        taskQueue,
        workflowId: `test-${nanoid()}`,
      }),
    );
    assert.equal(result, 'pipeline p1 done');
  });

  it('hub closes on signal', async () => {
    const taskQueue = `test-${nanoid()}`;
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
    });
    const result = await worker.runUntil(async () => {
      const handle = await env.client.workflow.start(hub, {
        args: [{ hubId: 'newsroom' }],
        taskQueue,
        workflowId: `test-${nanoid()}`,
      });
      await handle.signal(closeSignal);
      return await handle.result();
    });
    assert.equal(result, 'hub newsroom closed');
  });

  it('ticker emits and truncates', async () => {
    const taskQueue = `test-${nanoid()}`;
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
    });
    const result = await worker.runUntil(
      env.client.workflow.execute(ticker, {
        args: [{ count: 12, keepLast: 5, truncateEvery: 5 }],
        taskQueue,
        workflowId: `test-${nanoid()}`,
      }),
    );
    assert.equal(result, 'ticker emitted 12 events');
  });

  it('llmStreaming returns the streamed text', async () => {
    const mockActivities: typeof llmActivities = {
      async streamCompletion() {
        return 'a streamed answer';
      },
    };
    const taskQueue = `test-${nanoid()}`;
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows-llm'),
      activities: mockActivities,
    });
    const result = await worker.runUntil(
      env.client.workflow.execute(llmStreaming, {
        args: [{ prompt: 'hello' }],
        taskQueue,
        workflowId: `test-${nanoid()}`,
      }),
    );
    assert.equal(result, 'a streamed answer');
  });
});

// Runs the basic publish/subscribe scenario end to end against a local dev
// server: it exercises publishing from both the workflow and the activity (via
// the real client) and consuming via subscribe.
describe('workflow-streams subscribe integration', function () {
  let env: TestWorkflowEnvironment;

  this.slow(20_000);
  this.timeout(60_000);

  before(async function () {
    env = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await env?.teardown();
  });

  it('order publishes status and progress events end to end', async () => {
    const taskQueue = `test-${nanoid()}`;
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: realActivities,
    });

    const statuses: string[] = [];
    let progressCount = 0;
    const result = await worker.runUntil(async () => {
      const handle = await env.client.workflow.start(order, {
        args: [{ orderId: 'order-42' }],
        taskQueue,
        workflowId: `workflow-streams-order-test-${nanoid(8)}`,
      });

      const stream = WorkflowStreamClient.create(env.client, handle.workflowId);
      for await (const item of stream.subscribe([TOPIC_STATUS, TOPIC_PROGRESS])) {
        if (item.topic === TOPIC_STATUS) {
          const evt = defaultPayloadConverter.fromPayload<StatusEvent>(item.data);
          statuses.push(evt.kind);
          if (evt.kind === 'complete') break;
        } else if (item.topic === TOPIC_PROGRESS) {
          progressCount++;
        }
      }
      await stream[Symbol.asyncDispose]();

      return await handle.result();
    });

    assert.deepEqual(statuses, ['received', 'shipped', 'complete']);
    assert.ok(progressCount >= 2, `expected at least 2 progress events, got ${progressCount}`);
    assert.equal(result, 'charge-order-42');
  });
});
