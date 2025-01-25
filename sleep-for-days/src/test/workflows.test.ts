import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Runtime, Worker } from '@temporalio/worker';
import * as activities from '../activities';
import type * as activitiesType from '../activities';
import { complete, sleepForDays } from '../workflows';
import { nanoid } from 'nanoid';
import { days } from '../helpers';

describe('sleep-for-days workflow', function () {
    let testEnv: TestWorkflowEnvironment;
    const taskQueue = 'sleep-for-days';

    beforeAll(async () => {
        Runtime.install({});
        testEnv = await TestWorkflowEnvironment.createTimeSkipping();
    });

    afterAll(async () => {
        await testEnv?.teardown();
    });

    it('runs continuously until signal is received', async () => {
        const client = testEnv.client;
        // let activityExecutions = 0;

        const mockActivities: typeof activitiesType = {
            sendEmail: jest.fn(activities.sendEmail),
        }

        const worker = await Worker.create({
            connection: testEnv.nativeConnection,
            workflowsPath: require.resolve('../workflows'),
            // activities: mockActivities,
            activities: mockActivities,
            taskQueue,
        });

        const wfHandle = await client.workflow.start(sleepForDays, {
            taskQueue,
            args: [1], // 1 day sleep interval
            workflowId: nanoid(),
        });

        const startTime = await testEnv.currentTimeMs();
        expect(mockActivities.sendEmail).toHaveBeenCalledTimes(0);

        await worker.runUntil(async () => {
            // Time-skip 5 minutes.
            await testEnv.sleep('5m');
            // Check that the activity has been called, we're now waiting for the sleep to finish.
            expect(mockActivities.sendEmail).toHaveBeenCalledTimes(1);
            // Time-skip 3 days.
            await testEnv.sleep('3d');
            // Expect 3 more activity calls.
            expect(mockActivities.sendEmail).toHaveBeenCalledTimes(4);
            // Send the signal to complete the workflow.
            await wfHandle.signal(complete);
            // Wait for the workflow to complete.
            await testEnv.sleep('1d');
            // Expect no more activity calls to have been made - workflow is complete.
            expect(mockActivities.sendEmail).toHaveBeenCalledTimes(4);
            const endTime = await testEnv.currentTimeMs();
            // Expect more than 4 days to have passed.
            expect(endTime - startTime).toBeGreaterThan(days(4));
        });
    });
})