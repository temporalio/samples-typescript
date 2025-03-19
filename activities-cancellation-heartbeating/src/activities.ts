// @@@SNIPSTART typescript-activity-fake-progress
import {
  activityInfo,
  log,
  sleep,
  CancelledFailure,
  heartbeat,
  Context,
  ApplicationFailure
} from '@temporalio/activity';
import console from 'node:console';

export async function fakeProgress(sleepIntervalMs = 1000): Promise<void> {
  try {
    // allow for resuming from heartbeat
    const startingPoint = activityInfo().heartbeatDetails || 1;
    log.info('Starting activity at progress', { startingPoint });
    for (let progress = startingPoint; progress <= 100; ++progress) {
      // simple utility to sleep in activity for given interval or throw if Activity is cancelled
      // don't confuse with Workflow.sleep which is only used in Workflow functions!
      log.info('Progress', { progress });
      await sleep(sleepIntervalMs);
      heartbeat(progress);
    }
  } catch (err) {
    if (err instanceof CancelledFailure) {
      log.warn('Fake progress activity cancelled', { message: err.message });
      // Cleanup
    }
    throw err;
  }
}
// @@@SNIPEND

// @@@SNIPSTART typescript-activity-long-running
export interface ActivityExecutionDetails {
  heartbeatsReported: number
  mainOperationResult: string | undefined
  err: Error | undefined
}
export async function myLongRunningActivity(): Promise<ActivityExecutionDetails> {
  const ctx = Context.current()
  const details: ActivityExecutionDetails = {
    heartbeatsReported: ctx.info.heartbeatDetails || 0,
    mainOperationResult:  undefined,
    err: undefined
  }
  const logger = ctx.log
  const heartbeatTimeoutMs = ctx.info.heartbeatTimeoutMs
  if(!heartbeatTimeoutMs) {
    throw ApplicationFailure.nonRetryable("heartbeat is required", "ERR_MISSING_HEARTBEAT_TIMEOUT")
  }
  const heartbeatInterval = heartbeatTimeoutMs / 2

  // mainOperation is the "real" work we are doing in the Activity
  async function mainOperation(): Promise<string> {
    const successMessage = 'operation successful'
    // use startToClose as basis for overall ops timeouts
    const timeout = ctx.info.startToCloseTimeoutMs - 100

    return new Promise((resolve, reject) => {
      logger.debug('simulating operation for (ms)', {timeout})
      // this simulates some lengthy operation like a report generation or API call
      // we avoid using `sleep` so that the operation won't receive a CancelledFailure directly
      setTimeout(() => {
        // capture the operation result
        details.mainOperationResult = successMessage
        resolve(successMessage)
      }, timeout)
    })
  }
  // doHeartbeat creates the regular looped heartbeat we need
  async function doHeartbeat():Promise<void> {
    // noinspection InfiniteLoopJS
    logger.debug('heartbeating every (ms)',{heartbeatInterval})
    return new Promise((resolve, reject) => {
      return (async function periodic() {
        while(!details.err && !details.mainOperationResult) {
          try {
            // this will return a CancelledFailure if the server replies as such
            // since we arent catching it it will bubble up to the main operation
            await sleep(heartbeatInterval)
            // you can pass in details to the heartbeat if you like to preserve "where" you are
            heartbeat(++details.heartbeatsReported)
          } catch (err) {
            // demonstrate how to test for cancellation
            if(err instanceof CancelledFailure) {
              logger.error('cancelling heartbeat due to cancellation', {err})
            }
            logger.error('heartbeat received failure', {err})
            reject(err)
            // exit loop
            throw err
          }
        }
      })()
    })
    }
  // _race_ the heartbeat and mainOperation so that any failure from either mainOperation or heartbeat to arrive
  // will resolve the Promise collection. This is important for the CancelledFailure to be handled appropriately.
  // Cancellation of the process inside the mainOperation is outside the scope of this sample, but
  // you might need to abort processes explicitly upon Cancellation from Workflow.
  // For example, with https://developer.mozilla.org/en-US/docs/Web/API/AbortController
  try {
    const result: string | void =  await Promise.race([doHeartbeat(), mainOperation()])
    logger.debug('received result', {result})
  } catch (err) {
    logger.error('Activity received error', {err})
    details.err = err as Error
    if(err instanceof CancelledFailure) {
      // we could rethrow the error here or ignore it (as we have done here)
      // throw it. log it. sorted. :)
    }

  }
  return details
}


// @@@SNIPEND