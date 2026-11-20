import { createCipheriv, createDecipheriv, createSecretKey, KeyObject, randomBytes } from 'crypto';
import { deflateSync, inflateSync } from 'zlib';
import { Payload, PayloadCodec, SerializationContext } from '@temporalio/common';
import { temporal } from '@temporalio/proto';

const PayloadMessage = temporal.api.common.v1.Payload;

interface EndpointCodec {
  readonly keyId: string;
  readonly key: KeyObject;
  readonly compress: boolean;
}

// Hard-coded 128-bit keys are demonstration values, separate from their public key IDs.
const endpointCodecs: ReadonlyMap<string, EndpointCodec> = new Map([
  ['nexus-serialization-compressed-encrypted-1', endpointCodec('compressed-encrypted-1', 'handler-a-key-01', true)],
  ['nexus-serialization-compressed-encrypted-2', endpointCodec('compressed-encrypted-2', 'handler-a-key-02', true)],
  ['nexus-serialization-encrypted-1', endpointCodec('encrypted-1', 'handler-b-key-01', false)],
  ['nexus-serialization-encrypted-2', endpointCodec('encrypted-2', 'handler-b-key-02', false)],
]);

function endpointCodec(keyId: string, rawKey: string, compress: boolean): EndpointCodec {
  return Object.freeze({ keyId, key: createSecretKey(Buffer.from(rawKey)), compress });
}

/** Selects an endpoint's encryption, with a default for ordinary workflow payloads. */
export class NexusCodec implements PayloadCodec {
  private readonly workflowCodec: EndpointCodec;
  private readonly endpoints: ReadonlyMap<string, EndpointCodec>;

  constructor(role: 'caller' | 'compressed' | 'encrypted' = 'caller') {
    const endpoints = new Map<string, EndpointCodec>();
    for (const [endpoint, settings] of endpointCodecs) {
      if (role === 'caller') {
        endpoints.set(endpoint, settings);
      } else if (role === 'compressed' && settings.compress) {
        endpoints.set(endpoint, settings);
      } else if (role === 'encrypted' && !settings.compress) {
        endpoints.set(endpoint, settings);
      }
    }
    this.endpoints = endpoints;

    switch (role) {
      case 'caller':
        this.workflowCodec = endpointCodec('caller-workflow', 'sample-key-C-123', false);
        break;
      case 'compressed':
        this.workflowCodec = endpointCodec('compressed-encrypted-1', 'handler-a-key-01', false);
        break;
      case 'encrypted':
        this.workflowCodec = endpointCodec('encrypted-1', 'handler-b-key-01', false);
        break;
    }
  }

  private select(context?: SerializationContext): EndpointCodec {
    if (context?.type !== 'nexus') return this.workflowCodec;
    const selected = this.endpoints.get(context.endpoint);
    if (!selected) throw new Error(`Unknown Nexus endpoint: ${context.endpoint}`);
    return selected;
  }

  async encode(payloads: Payload[], context?: SerializationContext): Promise<Payload[]> {
    // Context stays local to this call so concurrent operations never mutate shared codec configuration.
    const { keyId, key, compress } = this.select(context);
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

  async decode(payloads: Payload[], context?: SerializationContext): Promise<Payload[]> {
    const { keyId, key, compress } = this.select(context);
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
