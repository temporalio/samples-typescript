import ms from 'ms';
import { Runtime, DefaultLogger, Worker } from '@temporalio/worker';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { v4 as uuid } from 'uuid';
import type { createActivities } from '../activities';
import { processOrderWorkflow } from '../workflows';

describe('countdownWorkflow', async function () {
  let env: TestWorkflowEnvironment;

  this.slow(10_000);
  this.timeout(20_000);

  before(async function () {
    // Filter INFO log messages for clearer test output
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.create();
  });

  after(async () => {
    await env.teardown();
  });

  it('sends reminder email if processing does not complete in time', async () => {
    // NOTE: this tests doesn't actually take days to complete, the test environment starts a test
    // server that automatically skips time when there are no running activities.
    let emailSent = false;
    const activities: ReturnType<typeof createActivities> = {
      async processOrder() {
        // Test server switches to "normal" time while an activity is executing.
        // Call `sleep` to skip time by "2 days".
        await env.sleep('2 days');
      },
      async sendNotificationEmail() {
        emailSent = true;
      },
    };
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows'),
      activities,
    });
    await worker.runUntil(
      env.workflowClient.execute(processOrderWorkflow, {
        workflowId: uuid(),
        taskQueue: 'test',
        args: [{ orderProcessingMS: ms('3 days'), sendDelayedEmailTimeoutMS: ms('1 day') }],
      })
    );
    assert.ok(emailSent);
  });

  it("doesn't send reminder email if processing completes in time", async () => {
    let emailSent = false;
    const activities: ReturnType<typeof createActivities> = {
      async processOrder() {
        // Haha eslint, no empty body
      },
      async sendNotificationEmail() {
        emailSent = true;
      },
    };
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows'),
      activities,
    });
    await worker.runUntil(
      env.workflowClient.execute(processOrderWorkflow, {
        workflowId: uuid(),
        taskQueue: 'test',
        args: [{ orderProcessingMS: ms('3 days'), sendDelayedEmailTimeoutMS: ms('1 day') }],
      })
    );
    assert.equal(emailSent, false);
  });
});
