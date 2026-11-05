import assert from 'assert';
import { randomUUID } from 'crypto';
import { after, before, describe, it } from 'mocha';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import * as activities from '../activities';
import { greetingService } from '../api';
import { greetingServiceHandler } from '../handler';
import { TASK_QUEUE } from '../shared';

describe('Nexus operation backed by a standalone Activity', () => {
  let endpointName: string;
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    endpointName = `test-nexus-activity-${randomUUID()}`;
    const executable = process.env.TEMPORAL_CLI_PATH
      ? { type: 'existing-path' as const, path: process.env.TEMPORAL_CLI_PATH }
      : { type: 'cached-download' as const, version: 'v1.7.4-standalone-nexus-operations' };
    testEnv = await TestWorkflowEnvironment.createLocal({
      server: {
        executable,
        extraArgs: ['--dynamic-config-value', 'activity.enableCallbacks=true'],
      },
    });
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('runs the Activity and returns its result through Nexus', async () => {
    await testEnv.createNexusEndpoint(endpointName, TASK_QUEUE);
    const { client, nativeConnection } = testEnv;

    const worker = await Worker.create({
      connection: nativeConnection,
      namespace: 'default',
      taskQueue: TASK_QUEUE,
      activities,
      nexusServices: [greetingServiceHandler],
    });

    await worker.runUntil(async () => {
      const nexusClient = client.nexus.createServiceClient({
        endpoint: endpointName,
        service: greetingService,
      });

      const result = await nexusClient.executeOperation(
        greetingService.operations.greet,
        { name: 'Test' },
        { id: randomUUID(), scheduleToCloseTimeout: '10s' },
      );

      assert.equal(result.message, 'Hello, Test!');
    });
  });
});
