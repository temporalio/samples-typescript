import { InterceptingCall, RequesterBuilder, type Interceptor } from '@grpc/grpc-js';

/**
 * Creates an interceptor that limits how frequently outbound gRPC calls begin.
 *
 * When registered after the SDK retry interceptor, each retry attempt is also rate limited.
 */
export function makeGrpcRpsInterceptor(rps: number): Interceptor {
  if (!Number.isSafeInteger(rps) || rps < 1) throw new Error('rps must be a positive integer');
  let nextStart = 0;
  let draining = false;
  const queue: Array<() => void> = [];

  const drain = (): void => {
    if (queue.length === 0) {
      draining = false;
      return;
    }
    const delay = nextStart - Date.now();
    if (delay > 0) {
      setTimeout(drain, delay);
      return;
    }
    const start = queue.shift()!;
    nextStart = Date.now() + 1000 / rps;
    try {
      start();
    } finally {
      if (queue.length > 0) setTimeout(drain, Math.max(0, nextStart - Date.now()));
      else draining = false;
    }
  };

  const schedule = (start: () => void): void => {
    queue.push(start);
    if (!draining) {
      draining = true;
      drain();
    }
  };

  return (options, nextCall) =>
    new InterceptingCall(
      nextCall(options),
      new RequesterBuilder()
        .withStart((metadata, listener, next) => {
          schedule(() => next(metadata, listener));
        })
        .build(),
    );
}
