import * as path from 'node:path';
import { ExternalStorage } from '@temporalio/common';
import type { DataConverter } from '@temporalio/common';
import { FileSystemStorageDriver } from './filesystem-storage-driver';

/**
 * Where the blobs live. Every process in this sample resolves the same directory, which
 * is what lets the Worker read a payload the Client wrote, in a different process.
 *
 * A real deployment points this at storage all Workers can reach: a shared volume, or
 * a driver backed by S3 or GCS. The SDK ships drivers for both, so if object storage
 * is where you are headed, prefer `@temporalio/external-storage-s3` or
 * `@temporalio/external-storage-gcs` over writing your own. This sample writes a
 * driver from scratch to show what the interface asks of you.
 */
export const STORAGE_ROOT = process.env.EXTERNAL_STORAGE_DIR ?? path.resolve(__dirname, '..', 'storage');

/**
 * Payloads at or above this size are offloaded; smaller ones are sent inline. Set low
 * here so the sample offloads without needing huge test data. The SDK default is
 * 256 KiB, which is a reasonable production starting point: it comfortably clears
 * Temporal's 2 MiB per-payload limit while leaving small payloads (the vast majority)
 * on the fast path, with no storage round trip.
 *
 * Setting this to `0` offloads every payload regardless of size. That is occasionally
 * useful for compliance ("no business data in the Temporal database"), but it puts a
 * storage round trip in front of every Signal, Query, and Activity argument.
 */
export const PAYLOAD_SIZE_THRESHOLD = 32 * 1024;

/**
 * Builds the DataConverter shared by the Worker and the Client.
 *
 * Both sides need it, and their driver `name`s must match: the reference payload in
 * History names the driver that wrote it, and the retrieving side looks it up by that
 * name. A Client without external storage configured cannot read an offloaded result;
 * it sees the raw reference and fails to deserialize it.
 *
 * Unlike `payloadConverterPath`, which is a *path* because the Workflow sandbox has to
 * load it separately, `externalStorage` is passed as a live object. Storing and
 * retrieving happen in Worker and Client code, outside the sandbox, so the driver is
 * free to do I/O and hold connections.
 */
// @@@SNIPSTART typescript-custom-driver-data-converter
export function createDataConverter(rootDir: string = STORAGE_ROOT): DataConverter {
  return {
    externalStorage: new ExternalStorage({
      drivers: [new FileSystemStorageDriver({ rootDir })],
      payloadSizeThreshold: PAYLOAD_SIZE_THRESHOLD,

      // With one driver registered, every offloaded payload goes to it. Register more
      // than one and a `driverSelector` becomes required, letting you route per
      // payload: a cheap archive tier for a known-bulky Workflow type, a driver per
      // tenant, or a per-region bucket. Returning `null` from the selector keeps that
      // payload inline, which is how you exempt specific payloads from offloading.
      //
      // driverSelector: (context, _payload) =>
      //   context.target?.type === 'processDocument' ? coldDriver : hotDriver,
    }),
  };
}
// @@@SNIPEND
