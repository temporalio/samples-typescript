import assert from 'assert';
import path from 'path';
import { createDecipheriv, randomUUID } from 'crypto';
import { inflateSync } from 'zlib';
import { Payload, defaultPayloadConverter } from '@temporalio/common';
import { temporal } from '@temporalio/proto';
import { after, before, describe, it } from 'mocha';
import { Client } from '@temporalio/client';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { NexusCodec } from '../codec';
import { CALLER, COMPRESSED_HANDLER, ENCRYPTED_HANDLER, ENDPOINTS } from '../shared';
import { callerWorkflow } from '../caller/workflows';
import { syncHandler, asyncHandler } from '../handler/handler';

describe('Nexus serialization context workflows', function () {
  this.timeout(60000);
  let env: TestWorkflowEnvironment;
  before(async () => {
    env = await TestWorkflowEnvironment.createLocal({
      server: {
        executable: { type: 'existing-path', path: process.env.TEMPORAL_CLI_PATH ?? path.resolve('temporal') },
        namespace: CALLER,
        extraArgs: ['--namespace', COMPRESSED_HANDLER, '--namespace', ENCRYPTED_HANDLER],
      },
    });
    for (const endpoint of ENDPOINTS) {
      const namespace = endpoint.includes('compressed') ? COMPRESSED_HANDLER : ENCRYPTED_HANDLER;
      await env.connection.operatorService.createNexusEndpoint({
        spec: { name: endpoint, target: { worker: { namespace, taskQueue: namespace } } },
      });
    }
  });
  after(async () => {
    await env?.teardown();
  });

  it('runs eight operations in five workflows with native async result context', async () => {
    const workers = await Promise.all([
      Worker.create({
        connection: env.nativeConnection,
        namespace: CALLER,
        taskQueue: CALLER,
        workflowsPath: require.resolve('../caller/workflows'),
        dataConverter: { payloadCodecs: [new NexusCodec()] },
      }),
      ...(
        [
          ['compressed', COMPRESSED_HANDLER],
          ['encrypted', ENCRYPTED_HANDLER],
        ] as const
      ).map(([role, namespace]) =>
        Worker.create({
          connection: env.nativeConnection,
          namespace,
          taskQueue: namespace,
          workflowsPath: require.resolve('../handler/workflows'),
          nexusServices: [syncHandler, asyncHandler],
          dataConverter: { payloadCodecs: [new NexusCodec(role)] },
        }),
      ),
    ]);
    const client = new Client({
      connection: env.connection,
      namespace: CALLER,
      dataConverter: { payloadCodecs: [new NexusCodec()] },
    });
    await workers[0].runUntil(() =>
      workers[1].runUntil(() =>
        workers[2].runUntil(async () => {
          const handle = await client.workflow.start(callerWorkflow, {
            workflowId: `nexus-serialization-${randomUUID()}`,
            taskQueue: CALLER,
            args: ['Hello from Nexus'],
            workflowExecutionTimeout: '30s',
          });
          assert.deepStrictEqual(
            await handle.result(),
            Object.fromEntries(
              ENDPOINTS.map((endpoint) => [endpoint, { sync: 'Hello from Nexus', async: 'Hello from Nexus' }]),
            ),
          );
          const history = await handle.fetchHistory();
          const scheduled = history.events!.flatMap((event) =>
            event.nexusOperationScheduledEventAttributes ? [event.nexusOperationScheduledEventAttributes] : [],
          );
          assert.equal(scheduled.length, 8);
          assert.deepStrictEqual(
            scheduled.map((operation) => `${operation.endpoint}/${operation.service}/${operation.operation}`).sort(),
            ENDPOINTS.flatMap((endpoint) => [
              `${endpoint}/SyncEchoService/echo`,
              `${endpoint}/AsyncEchoService/echoAsync`,
            ]).sort(),
          );

          const completedEvents = history.events!.filter((event) => event.nexusOperationCompletedEventAttributes);
          assert.equal(completedEvents.length, 8);
          const lastScheduled = Math.max(
            ...history
              .events!.filter((event) => event.nexusOperationScheduledEventAttributes)
              .map((event) => Number(event.eventId)),
          );
          assert.ok(completedEvents.every((event) => Number(event.eventId) > lastScheduled));

          assert.equal(history.events!.filter((event) => event.nexusOperationStartedEventAttributes).length, 4);
          for (const operation of scheduled) {
            assert.ok(ENDPOINTS.includes(operation.endpoint as (typeof ENDPOINTS)[number]));
            assert.equal(operation.service, operation.operation === 'echo' ? 'SyncEchoService' : 'AsyncEchoService');
            assertEndpointPayload(operation.input!, operation.endpoint!);
          }
          const callerStarted = history.events![0].workflowExecutionStartedEventAttributes!;
          const callerCompleted = history.events!.find(
            (event) => event.workflowExecutionCompletedEventAttributes,
          )!.workflowExecutionCompletedEventAttributes!;
          for (const payload of [callerStarted.input!.payloads![0], callerCompleted.result!.payloads![0]]) {
            assert.equal(payload.metadata!['nexus-endpoint-name'], undefined);
            assert.equal(Buffer.from(payload.metadata!['encryption-key-id']).toString(), 'caller-workflow');
            decrypt(payload, 'sample-key-C-123', false);
          }
          const endpoints = new Set<string>();
          const workflowIds = new Set<string>();
          for (const namespace of [COMPRESSED_HANDLER, ENCRYPTED_HANDLER]) {
            const handlerClient = new Client({ connection: env.connection, namespace });
            const executions = [];
            for await (const execution of handlerClient.workflow.list()) executions.push(execution);
            assert.equal(executions.length, 2);
            for (const execution of executions) {
              assert.ok(execution.workflowId.startsWith('nexus-echo-'));
              workflowIds.add(execution.workflowId);
              const backing = await handlerClient.workflow.getHandle(execution.workflowId).fetchHistory();
              const started = backing.events![0].workflowExecutionStartedEventAttributes!;
              const context = started.propagatedNexusSerializationContext!;
              assert.ok(context);
              assert.equal(context.service, 'AsyncEchoService');
              assert.equal(context.operation, 'echoAsync');
              assert.ok(ENDPOINTS.includes(context.endpoint as (typeof ENDPOINTS)[number]));
              endpoints.add(context.endpoint!);
              const request = scheduled.find(
                (operation) => operation.endpoint === context.endpoint && operation.operation === 'echoAsync',
              );
              assert.ok(request?.requestId);
              assert.equal(execution.workflowId, `nexus-echo-${request.requestId}`);

              const input = started.input!.payloads![0];
              const compressed = namespace === COMPRESSED_HANDLER;
              assert.equal(
                Buffer.from(input.metadata!['encryption-key-id']).toString(),
                compressed ? 'compressed-encrypted-1' : 'encrypted-1',
              );
              assert.equal(input.metadata!['nexus-endpoint-name'], undefined);
              assert.equal(
                decrypt(input, compressed ? 'handler-a-key-01' : 'handler-b-key-01', false),
                'Hello from Nexus',
              );
              const completed = backing.events!.find(
                (event) => event.workflowExecutionCompletedEventAttributes,
              )!.workflowExecutionCompletedEventAttributes!;
              assertEndpointPayload(completed.result!.payloads![0], context.endpoint!);
            }
          }
          assert.deepStrictEqual(endpoints, new Set(ENDPOINTS));
          assert.equal(workflowIds.size, 4);
        }),
      ),
    );
  });
});

function decrypt(payload: Payload, key: string, compressed: boolean): unknown {
  const data = Buffer.from(payload.data!);
  const decipher = createDecipheriv('aes-128-gcm', Buffer.from(key), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(-16));
  let inner = temporal.api.common.v1.Payload.decode(
    Buffer.concat([decipher.update(data.subarray(12, -16)), decipher.final()]),
  );
  if (compressed) {
    assert.deepStrictEqual(inner.metadata, { encoding: Buffer.from('binary/nexus-zlib') });
    inner = temporal.api.common.v1.Payload.decode(inflateSync(inner.data));
  }
  assert.deepStrictEqual(inner.metadata, { encoding: Buffer.from('json/plain') });
  return defaultPayloadConverter.fromPayload(inner);
}

function assertEndpointPayload(payload: Payload, endpoint: string): void {
  const keyId = endpoint.replace('nexus-serialization-', '');
  assert.deepStrictEqual(payload.metadata, {
    encoding: Buffer.from('binary/nexus-aes-gcm'),
    'encryption-key-id': Buffer.from(keyId),
    'nexus-endpoint-name': Buffer.from(endpoint),
  });
  assert.equal(
    decrypt(
      payload,
      `handler-${endpoint.includes('compressed') ? 'a' : 'b'}-key-0${endpoint.slice(-1)}`,
      endpoint.includes('compressed'),
    ),
    'Hello from Nexus',
  );
}
