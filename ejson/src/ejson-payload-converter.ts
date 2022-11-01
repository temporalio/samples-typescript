// TODO switch to this once this is merged: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/63028
// import { decode, encode } from 'fastestsmallesttextencoderdecoder';
// @@@SNIPSTART typescript-ejson-converter-impl
import { EncodingType, METADATA_ENCODING_KEY, Payload, PayloadConverterWithEncoding } from '@temporalio/common';
import { PayloadConverterError } from '@temporalio/internal-workflow-common';
import EJSON from 'ejson';
import { decode, encode } from '@temporalio/common/lib/encoding';

/**
 * Converts between values and [EJSON](https://docs.meteor.com/api/ejson.html) Payloads.
 */
export class EjsonPayloadConverter implements PayloadConverterWithEncoding {
  // Use 'json/plain' so that Payloads are displayed in the UI
  public encodingType = 'json/plain' as EncodingType;

  public toPayload(value: unknown): Payload | undefined {
    if (value === undefined) return undefined;
    let ejson;
    try {
      ejson = EJSON.stringify(value);
    } catch (e) {
      throw new UnsupportedEjsonTypeError(
        `Can't run EJSON.stringify on this value: ${value}. Either convert it (or its properties) to EJSON-serializable values (see https://docs.meteor.com/api/ejson.html ), or create a custom data converter. EJSON.stringify error message: ${errorMessage(
          e
        )}`,
        e as Error
      );
    }

    return {
      metadata: {
        [METADATA_ENCODING_KEY]: encode('json/plain'),
        // Include an additional metadata field to indicate that this is an EJSON payload
        format: encode('extended'),
      },
      data: encode(ejson),
    };
  }

  public fromPayload<T>(content: Payload): T {
    return content.data ? EJSON.parse(decode(content.data)) : content.data;
  }
}

export class UnsupportedEjsonTypeError extends PayloadConverterError {
  public readonly name: string = 'UnsupportedJsonTypeError';

  constructor(message: string | undefined, public readonly cause?: Error) {
    super(message ?? undefined);
  }
}
// @@@SNIPEND

export function errorMessage(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
}
