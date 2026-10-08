import { fileURLToPath } from 'node:url';
import type { DataConverter, Payload, PayloadCodec, PayloadConverter } from '@temporalio/common';

export const payloadConverter: PayloadConverter = {
  toPayload<T>(value: T) {
    return value as unknown as Payload;
  },
  fromPayload<T>(payload: Payload) {
    return payload as T;
  },
};

export const noopPayloadCodec: PayloadCodec = {
  async encode(payloads) {
    return payloads;
  },
  async decode(payloads) {
    return payloads;
  },
};

/**
 * Data Converter used by the history downloader to preserve Payloads as stored.
 *
 * The downloader does not inspect application values, and downloaded history
 * files must contain encoded payload data rather than decoded values.
 */
export const noopDataConverter: DataConverter = {
  payloadConverterPath: fileURLToPath(import.meta.url),
  payloadCodecs: [noopPayloadCodec],
};
