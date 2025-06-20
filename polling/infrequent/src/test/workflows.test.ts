import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import * as activities from '../activities';
import type * as activitiesType from '../activities';
import { greetingWorkflow } from '../workflows';
import { nanoid } from 'nanoid';

describe('frequent polling workflow', function () {
  let testEnv: TestWorkflowEnvironment;
  const taskQueue = 'frequent-activity-polling-task-queue';

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('runs returns expected greeting', async () => {
    const { client, nativeConnection } = testEnv;

    const mockActivities: typeof activitiesType = {
      composeGreeting: jest.fn(activities.composeGreeting),
    };

    const worker = await Worker.create({
      connection: nativeConnection,
      workflowsPath: require.resolve('../workflows'),
      activities: mockActivities,
      taskQueue,
    });

    expect(mockActivities.composeGreeting).toHaveBeenCalledTimes(0);

    const result = await worker.runUntil(
      client.workflow.execute(greetingWorkflow, {
        args: ['Temporal'],
        workflowId: nanoid(),
        taskQueue,
      }),
    );

    assert.equal(result, 'Hello, Temporal!');
    // Check that the activity isn't being retried. The recurring polling is
    // happeing within the activity.
    expect(mockActivities.composeGreeting).toHaveBeenCalledTimes(1);
  });
});
