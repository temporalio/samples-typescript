import assert from 'assert';
import { randomUUID } from 'crypto';
import { after, before, describe, it } from 'mocha';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { myNexusService } from '../api';
import { NAMESPACE, TASK_QUEUE } from '../shared';
import { myNexusServiceHandler } from '../worker/handler';

describe('Nexus standalone operations', () => {
  let endpointName: string;
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    endpointName = `test-nexus-standalone-${randomUUID()}`;
    testEnv = await TestWorkflowEnvironment.createLocal({
      server: {
        extraArgs: [
          '--dynamic-config-value',
          'nexusoperation.enableStandalone=true',
          '--dynamic-config-value',
          'history.enableChasmCallbacks=true',
        ],
        executable: {
          type: 'cached-download',
          version: 'v1.7.2-standalone-nexus-operations',
        },
      },
    });
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('executes, lists, and counts standalone operations', async () => {
    await testEnv.createNexusEndpoint(endpointName, TASK_QUEUE);
    const { client, nativeConnection } = testEnv;

    const worker = await Worker.create({
      connection: nativeConnection,
      namespace: NAMESPACE,
      taskQueue: TASK_QUEUE,
      workflowsPath: require.resolve('../worker/workflows'),
      nexusServices: [myNexusServiceHandler],
    });

    await worker.runUntil(async () => {
      const nexusClient = client.nexus.createServiceClient({
        endpoint: endpointName,
        service: myNexusService,
      });

      const echoOperationId = `echo-${randomUUID()}`;
      try {
        const echoResult = await nexusClient.executeOperation(
          myNexusService.operations.echo,
          { message: 'test-echo' },
          {
            id: echoOperationId,
            scheduleToCloseTimeout: '10s',
          },
        );
        assert.equal(echoResult.message, 'test-echo');
      } catch (err) {
        console.log(err);
        throw err;
      }

      const helloOperationId = `hello-${randomUUID()}`;
      try {
        const handle = await nexusClient.startOperation(
          myNexusService.operations.hello,
          { name: 'Test' },
          {
            id: helloOperationId,
            scheduleToCloseTimeout: '10s',
          },
        );
        assert.equal(handle.operationId, helloOperationId);

        const helloResult = await handle.result();
        assert.equal(helloResult.greeting, 'Hello, Test!');
      } catch (err) {
        console.log(err);
        throw err;
      }

      const query = `Endpoint="${endpointName}"`;
      const count = await client.nexus.count(query);
      assert.equal(count.count, 2);

      const listedOperationIds = new Set<string>();
      for await (const operation of client.nexus.list({ query })) {
        listedOperationIds.add(operation.operationId);
      }
      assert.deepEqual(listedOperationIds, new Set([echoOperationId, helloOperationId]));
    });
  });
});
