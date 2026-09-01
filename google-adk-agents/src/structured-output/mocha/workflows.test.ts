import type { LlmResponse } from '@google/adk';
import { WorkflowFailedError } from '@temporalio/client';
import { ApplicationFailure } from '@temporalio/common';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { fakeModelProvider } from '@temporalio/google-adk-agents/testing';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { summarizeIncident } from '../workflows';

describe('google-adk-agents/structured-output', function () {
  this.timeout(30_000);
  let testEnv: TestWorkflowEnvironment;
  before(async () => (testEnv = await TestWorkflowEnvironment.createLocal()));
  after(async () => testEnv?.teardown());

  async function execute(text: string) {
    const response: LlmResponse = { content: { role: 'model', parts: [{ text }] }, turnComplete: true };
    const taskQueue = `test-structured-output-${Date.now()}-${Math.random()}`;
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ modelProvider: fakeModelProvider([response]) })],
    });
    return worker.runUntil(
      testEnv.client.workflow.execute(summarizeIncident, {
        args: ['The database is timing out.'],
        workflowId: taskQueue,
        taskQueue,
      }),
    );
  }

  it('returns a typed incident summary', async () => {
    assert.deepStrictEqual(await execute('{"title":"Database outage","severity":"high","actions":["Fail over"]}'), {
      title: 'Database outage',
      severity: 'high',
      actions: ['Fail over'],
    });
  });

  it('omits properties outside the schema', async () => {
    assert.deepStrictEqual(
      await execute('{"title":"Database outage","severity":"high","actions":["Fail over"],"extra":"ignore"}'),
      {
        title: 'Database outage',
        severity: 'high',
        actions: ['Fail over'],
      },
    );
  });

  it('rejects output outside the schema', async () => {
    await assert.rejects(execute('{"title":"Database outage","severity":"urgent","actions":[]}'), (error) => {
      assert(error instanceof WorkflowFailedError);
      assert(error.cause instanceof ApplicationFailure);
      assert.strictEqual(error.cause.nonRetryable, true);
      assert.strictEqual(error.cause.type, 'InvalidIncidentSummary');
      return true;
    });
  });

  it('rejects malformed JSON', async () => {
    await assert.rejects(execute('{"title":'), (error) => {
      assert(error instanceof WorkflowFailedError);
      assert(error.cause instanceof ApplicationFailure);
      assert.strictEqual(error.cause.nonRetryable, true);
      assert.strictEqual(error.cause.type, 'InvalidIncidentSummary');
      return true;
    });
  });
});
