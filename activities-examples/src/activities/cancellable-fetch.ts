// @@@SNIPSTART typescript-activity-cancellable-fetch
import fetch from 'node-fetch';
import { cancellationSignal, heartbeat } from '@temporalio/activity';
import type { AbortSignal as FetchAbortSignal } from 'node-fetch/externals';

export async function cancellableFetch(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { signal: cancellationSignal() as FetchAbortSignal });
  const contentLengthHeader = response.headers.get('Content-Length');
  if (contentLengthHeader === null) {
    throw new Error('expected Content-Length header to be set');
  }
  const contentLength = parseInt(contentLengthHeader);
  let bytesRead = 0;
  const chunks: Buffer[] = [];

  for await (const chunk of response.body) {
    if (!(chunk instanceof Buffer)) {
      throw new TypeError('Expected Buffer');
    }
    bytesRead += chunk.length;
    chunks.push(chunk);
    heartbeat(bytesRead / contentLength);
  }
  return Buffer.concat(chunks);
}
// @@@SNIPEND
