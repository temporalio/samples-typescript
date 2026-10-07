import assert from 'node:assert/strict';
import test from 'node:test';
import { Metadata, status, type Interceptor, type InterceptorOptions, type NextCall } from '@grpc/grpc-js';
import { makeGrpcRetryInterceptor } from '@temporalio/client/lib/grpc-retry.js';
import { makeGrpcRpsInterceptor } from '../src/internal/grpc-rate-limit-interceptor.js';

void test('requires a positive integer rate', () => {
  for (const rate of [0, -1, 1.5, Number.NaN]) {
    assert.throws(() => makeGrpcRpsInterceptor(rate), /rps must be a positive integer/);
  }
});

void test('starts queued calls in order at the configured rate', async () => {
  const limiter = makeGrpcRpsInterceptor(20);
  const starts: Array<{ id: number; time: number }> = [];

  await Promise.all([0, 1, 2].map((id) => startCall(limiter, () => starts.push({ id, time: Date.now() }))));

  assert.deepEqual(
    starts.map(({ id }) => id),
    [0, 1, 2],
  );
  assert.ok(starts[1]!.time - starts[0]!.time >= 40);
  assert.ok(starts[2]!.time - starts[1]!.time >= 40);
});

void test('rate limits the first attempt and retries when registered after the retry interceptor', async () => {
  const limiter = makeGrpcRpsInterceptor(10);
  const retry = makeGrpcRetryInterceptor({
    delayFunction: () => 0,
    retryableDecider: (attempt, result) => attempt < 2 && result.code === status.UNAVAILABLE,
  });
  const startedAt: number[] = [];
  let attempts = 0;
  const options = {} as InterceptorOptions;
  const call = retry(options, (retryOptions) =>
    limiter(retryOptions, () => {
      let listener: NonNullable<Parameters<ReturnType<NextCall>['start']>[1]>;
      return {
        start(_metadata: Metadata, received: typeof listener) {
          listener = received;
          attempts++;
          startedAt.push(Date.now());
        },
        sendMessageWithContext() {},
        halfClose() {
          const code = attempts === 1 ? status.UNAVAILABLE : status.OK;
          setImmediate(() => {
            listener.onReceiveMessage?.({});
            listener.onReceiveStatus?.({ code, details: '', metadata: new Metadata() });
          });
        },
      } as unknown as ReturnType<NextCall>;
    }),
  );
  const result = new Promise<number>((resolve) => {
    call.start(new Metadata(), { onReceiveStatus: (received) => resolve(received.code) });
  });
  call.sendMessage({});
  call.halfClose();

  assert.equal(await result, status.OK);
  assert.equal(attempts, 2);
  assert.ok(startedAt[1]! - startedAt[0]! >= 90, `Attempts were ${startedAt[1]! - startedAt[0]!} ms apart`);
});

function startCall(interceptor: Interceptor, onStart: () => void): Promise<void> {
  return new Promise((resolve) => {
    const call = interceptor({} as InterceptorOptions, () => {
      return {
        start() {
          onStart();
          resolve();
        },
      } as unknown as ReturnType<NextCall>;
    });
    call.start(new Metadata(), {});
  });
}
