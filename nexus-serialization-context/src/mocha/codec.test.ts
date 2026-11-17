import assert from 'assert';
import { createDecipheriv } from 'crypto';
import { inflateSync } from 'zlib';
import { temporal } from '@temporalio/proto';
import { describe, it } from 'mocha';
import { defaultPayloadConverter, NexusSerializationContext } from '@temporalio/common';
import { NexusCodec } from '../codec';

describe('Nexus codec', () => {
  it('round trips caller requests and handler results through every endpoint', async () => {
    for (const keyId of ['compressed-encrypted-1', 'compressed-encrypted-2', 'encrypted-1', 'encrypted-2']) {
      const context: NexusSerializationContext = {
        type: 'nexus',
        endpoint: `nexus-serialization-${keyId}`,
        service: 'SyncEchoService',
        operation: 'echo',
      };
      const caller = new NexusCodec();
      const handler = new NexusCodec(keyId.startsWith('compressed') ? 'compressed' : 'encrypted');
      const [request] = await caller.encode([defaultPayloadConverter.toPayload('hello')], context);
      assert.deepStrictEqual(request.metadata, {
        encoding: Buffer.from('binary/nexus-aes-gcm'),
        'encryption-key-id': Buffer.from(keyId),
        'nexus-endpoint-name': Buffer.from(context.endpoint),
      });
      const [decoded] = await handler.decode([request], context);
      assert.equal(defaultPayloadConverter.fromPayload(decoded), 'hello');
      const [result] = await handler.encode([defaultPayloadConverter.toPayload('reply')], context);
      assert.deepStrictEqual(result.metadata, request.metadata);
      const [reply] = await caller.decode([result], context);
      assert.equal(defaultPayloadConverter.fromPayload(reply), 'reply');
    }
  });
  it('compresses before encrypting with either key', async () => {
    const codec = new NexusCodec();
    const payload = defaultPayloadConverter.toPayload('repeat me '.repeat(100));
    for (const number of [1, 2]) {
      const context = (id: string): NexusSerializationContext => ({
        type: 'nexus',
        endpoint: `nexus-serialization-${id}-${number}`,
        service: 'SyncEchoService',
        operation: 'echo',
      });
      const [compressed] = await codec.encode([payload], context('compressed-encrypted'));
      const [encrypted] = await codec.encode([payload], context('encrypted'));
      assert.ok(compressed.data!.length < encrypted.data!.length);
      const [decoded] = await codec.decode([compressed], context('compressed-encrypted'));
      assert.equal(defaultPayloadConverter.fromPayload(decoded), 'repeat me '.repeat(100));
    }
  });

  it('uses the expected raw keys and inner protobuf format for Nexus and ordinary workflows', async () => {
    for (const [role, endpoint, keyId, rawKey, compressed] of [
      ['caller', 'compressed-encrypted-1', 'compressed-encrypted-1', 'handler-a-key-01', true],
      ['caller', 'compressed-encrypted-2', 'compressed-encrypted-2', 'handler-a-key-02', true],
      ['caller', 'encrypted-1', 'encrypted-1', 'handler-b-key-01', false],
      ['caller', 'encrypted-2', 'encrypted-2', 'handler-b-key-02', false],
      ['caller', '', 'caller-workflow', 'sample-key-C-123', false],
      ['compressed', '', 'compressed-encrypted-1', 'handler-a-key-01', false],
      ['encrypted', '', 'encrypted-1', 'handler-b-key-01', false],
    ] as const) {
      const codec = new NexusCodec(role);
      const context = endpoint
        ? {
            type: 'nexus' as const,
            endpoint: `nexus-serialization-${endpoint}`,
            service: 'AsyncEchoService',
            operation: 'echoAsync',
          }
        : { type: 'workflow' as const, namespace: 'handler', workflowId: 'workflow-id' };
      for (const value of ['Hello from Nexus', { sync: 'Hello from Nexus', async: 'reply' }]) {
        const [payload] = await codec.encode([defaultPayloadConverter.toPayload(value)], context);
        assert.equal(Buffer.from(payload.metadata!['encryption-key-id']).toString(), keyId);
        assert.deepStrictEqual(
          payload.metadata!['nexus-endpoint-name'],
          endpoint ? Buffer.from(`nexus-serialization-${endpoint}`) : undefined,
        );
        const data = Buffer.from(payload.data!);
        assert.ok(!data.includes(Buffer.from('Hello from Nexus')));
        const decipher = createDecipheriv('aes-128-gcm', Buffer.from(rawKey), data.subarray(0, 12));
        decipher.setAuthTag(data.subarray(-16));
        let inner = temporal.api.common.v1.Payload.decode(
          Buffer.concat([decipher.update(data.subarray(12, -16)), decipher.final()]),
        );
        if (compressed) {
          assert.deepStrictEqual(inner.metadata, { encoding: Buffer.from('binary/nexus-zlib') });
          inner = temporal.api.common.v1.Payload.decode(inflateSync(inner.data));
        }
        assert.deepStrictEqual(inner.metadata, { encoding: Buffer.from('json/plain') });
        assert.deepStrictEqual(defaultPayloadConverter.fromPayload(inner), value);
        const [decoded] = await codec.decode([payload], context);
        assert.deepStrictEqual(defaultPayloadConverter.fromPayload(decoded), value);
      }
    }
  });

  it('rejects unknown endpoints on both encode and decode', async () => {
    const codec = new NexusCodec();
    const context: NexusSerializationContext = {
      type: 'nexus',
      endpoint: 'unknown',
      service: 'SyncEchoService',
      operation: 'echo',
    };
    await assert.rejects(
      codec.encode([defaultPayloadConverter.toPayload('hello')], context),
      /Unknown Nexus endpoint: unknown/,
    );
    await assert.rejects(codec.decode([], context), /Unknown Nexus endpoint: unknown/);
  });

  it('keeps overlapping endpoint calls separate and leaves ordinary workflow defaults unchanged', async () => {
    const codec = new NexusCodec();
    const contexts: NexusSerializationContext[] = [1, 2].map((number) => ({
      type: 'nexus',
      endpoint: `nexus-serialization-encrypted-${number}`,
      service: 'SyncEchoService',
      operation: 'echo',
    }));
    const payload = defaultPayloadConverter.toPayload('hello');
    const pending = contexts.map((context) => codec.encode([payload], context));
    const [ordinary] = await codec.encode([payload]);
    const results = await Promise.all(pending);
    for (const [index, [encoded]] of results.entries()) {
      assert.equal(Buffer.from(encoded.metadata!['encryption-key-id']).toString(), `encrypted-${index + 1}`);
      assert.equal(Buffer.from(encoded.metadata!['nexus-endpoint-name']).toString(), contexts[index].endpoint);
      const [decoded] = await codec.decode([encoded], contexts[index]);
      assert.equal(defaultPayloadConverter.fromPayload(decoded), 'hello');
    }
    assert.equal(Buffer.from(ordinary.metadata!['encryption-key-id']).toString(), 'caller-workflow');
    assert.equal(ordinary.metadata!['nexus-endpoint-name'], undefined);
    const [after] = await codec.encode([payload], { type: 'workflow', namespace: 'caller', workflowId: 'caller-id' });
    assert.deepStrictEqual(after.metadata, ordinary.metadata);
  });

  it('uses a fresh nonce and ciphertext for repeated values', async () => {
    const codec = new NexusCodec();
    const context: NexusSerializationContext = {
      type: 'nexus',
      endpoint: 'nexus-serialization-encrypted-1',
      service: 'SyncEchoService',
      operation: 'echo',
    };
    const input = defaultPayloadConverter.toPayload('hello');
    const [first] = await codec.encode([input], context);
    const [second] = await codec.encode([input], context);
    assert.notDeepStrictEqual(first.data!.subarray(0, 12), second.data!.subarray(0, 12));
    assert.notDeepStrictEqual(first.data, second.data);
    for (const encrypted of [first, second]) {
      const [decoded] = await codec.decode([encrypted], context);
      assert.equal(defaultPayloadConverter.fromPayload(decoded), 'hello');
    }
  });

  it('rejects altered ciphertext, incomplete nonces, and truncated authentication tags', async () => {
    const codec = new NexusCodec();
    const context: NexusSerializationContext = {
      type: 'nexus',
      endpoint: 'nexus-serialization-encrypted-1',
      service: 'SyncEchoService',
      operation: 'echo',
    };
    const [payload] = await codec.encode([defaultPayloadConverter.toPayload('hello')], context);
    const data = Buffer.from(payload.data!);
    const altered = Buffer.from(data);
    altered[12] ^= 1;
    for (const damaged of [altered, data.subarray(0, 1), data.subarray(0, -1)]) {
      await assert.rejects(codec.decode([{ ...payload, data: damaged }], context));
    }
  });
});
