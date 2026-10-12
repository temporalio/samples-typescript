import type { google } from '@temporalio/proto';

export function timestampToISOString(timestamp: google.protobuf.ITimestamp | null | undefined): string | undefined {
  if (!timestamp) return undefined;
  // Proto JSON rehydration can return numeric seconds, even though the generated
  // types declare Long. Number() accepts either representation.
  return new Date(Number(timestamp.seconds ?? 0) * 1000 + (timestamp.nanos ?? 0) / 1_000_000).toISOString();
}
