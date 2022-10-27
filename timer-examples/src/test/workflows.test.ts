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
    env = await TestWorkflowEnvironment.createTimeSkipping();
  });

  after(async () => {
    await env.teardown();
  });

  // @@@SNIPSTART typescript-timer-reminder-test
  it('sends reminder email if processOrder does not complete in time', async () => {
    // This test doesn't actually take days to complete: the TestWorkflowEnvironment starts the
    // Test Server, which automatically skips time when there are no running Activities.
    let emailSent = false;
    const mockActivities: ReturnType<typeof createActivities> = {
      async processOrder() {
        // Test server switches to "normal" time while an Activity is executing.
        // Call `env.sleep` to skip ahead 2 days, by which time sendNotificationEmail
        // should have been called.
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
      activities: mockActivities,
    });
    await worker.runUntil(
      env.client.workflow.execute(processOrderWorkflow, {
        workflowId: uuid(),
        taskQueue: 'test',
        args: [{ orderProcessingMS: ms('3 days'), sendDelayedEmailTimeoutMS: ms('1 day') }],
      })
    );
    assert.ok(emailSent);
  });
  // @@@SNIPEND

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
      env.client.workflow.execute(processOrderWorkflow, {
        workflowId: uuid(),
        taskQueue: 'test',
        args: [{ orderProcessingMS: ms('3 days'), sendDelayedEmailTimeoutMS: ms('1 day') }],
      })
    );
    assert.equal(emailSent, false);
  });
});
