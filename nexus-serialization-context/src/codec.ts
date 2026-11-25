import { createCipheriv, createDecipheriv, createSecretKey, randomBytes } from 'crypto';
import { deflateSync, inflateSync } from 'zlib';
import { Payload, PayloadCodec, SerializationContext } from '@temporalio/common';
import { temporal } from '@temporalio/proto';

const PayloadMessage = temporal.api.common.v1.Payload;

/** Routes payloads to an endpoint codec or the application's ordinary workflow codec. */
export class NexusCodec implements PayloadCodec {
  constructor(
    private readonly endpointCodecs: ReadonlyMap<string, PayloadCodec>,
    private readonly workflowCodec: PayloadCodec,
  ) {}

  private select(context?: SerializationContext): PayloadCodec {
    if (context?.type !== 'nexus') return this.workflowCodec;
    const selected = this.endpointCodecs.get(context.endpoint);
    if (!selected) throw new Error(`Unknown Nexus endpoint: ${context.endpoint}`);
    return selected;
  }

  async encode(payloads: Payload[], context?: SerializationContext): Promise<Payload[]> {
    return this.select(context).encode(payloads, context);
  }

  async decode(payloads: Payload[], context?: SerializationContext): Promise<Payload[]> {
    return this.select(context).decode(payloads, context);
  }
}

/** Demonstration AES-GCM codec, optionally compressing before encryption. */
export class EncryptionCodec implements PayloadCodec {
  private readonly key;

  constructor(
    private readonly keyId: string,
    rawKey: string,
    private readonly compress = false,
  ) {
    this.key = createSecretKey(Buffer.from(rawKey));
  }

  async encode(payloads: Payload[], context?: SerializationContext): Promise<Payload[]> {
    // Context stays local to this call so concurrent operations never mutate shared codec configuration.
    const { keyId, key, compress } = this;
    return payloads.map((payload) => {
      if (compress) {
        payload = {
          metadata: { encoding: Buffer.from('binary/nexus-zlib') },
          data: deflateSync(PayloadMessage.encode(payload).finish()),
        };
      }
      const nonce = randomBytes(12);
      const cipher = createCipheriv('aes-128-gcm', key, nonce);
      return {
        metadata: {
          encoding: Buffer.from('binary/nexus-aes-gcm'),
          'encryption-key-id': Buffer.from(keyId),
          ...(context?.type === 'nexus' ? { 'nexus-endpoint-name': Buffer.from(context.endpoint) } : {}),
        },
        data: Buffer.concat([
          nonce,
          cipher.update(PayloadMessage.encode(payload).finish()),
          cipher.final(),
          cipher.getAuthTag(),
        ]),
      };
    });
  }

  async decode(payloads: Payload[], _context?: SerializationContext): Promise<Payload[]> {
    const { keyId, key, compress } = this;
    return payloads.map((payload) => {
      if (Buffer.from(payload.metadata?.encoding ?? []).toString() !== 'binary/nexus-aes-gcm') return payload;
      if (Buffer.from(payload.metadata?.['encryption-key-id'] ?? []).toString() !== keyId)
        throw new Error('Unexpected encryption key ID');
      const data = Buffer.from(payload.data ?? []);
      if (data.length < 28) throw new Error('AES-GCM payload is too short');
      const cipher = createDecipheriv('aes-128-gcm', key, data.subarray(0, 12));
      cipher.setAuthTag(data.subarray(-16));
      let inner = PayloadMessage.decode(Buffer.concat([cipher.update(data.subarray(12, -16)), cipher.final()]));
      if (compress) {
        if (Buffer.from(inner.metadata?.encoding ?? []).toString() !== 'binary/nexus-zlib')
          throw new Error('Expected a Nexus zlib payload');
        inner = PayloadMessage.decode(inflateSync(inner.data));
      }
      return inner;
    });
  }
}
