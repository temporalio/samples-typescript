// TODO: put this into the activities-cancellation-heartbeating repo

/**
 * Demonstrates the basics of cancellation scopes.
 */
// @@@SNIPSTART typescript-cancel-a-timer-from-workflow
import { CancelledFailure, CancellationScope, sleep } from '@temporalio/workflow';

export async function cancelTimer(): Promise<void> {
  // Timers and Activities are automatically cancelled when their containing scope is cancelled.
  try {
    await CancellationScope.cancellable(async () => {
      const promise = sleep(1); // <-- Will be cancelled because it is attached to this closure's scope
      CancellationScope.current().cancel();
      await promise; // <-- Promise must be awaited in order for `cancellable` to throw
    });
  } catch (e) {
    if (e instanceof CancelledFailure) {
      console.log('Timer cancelled 👍');
    } else {
      throw e; // <-- Fail the workflow
    }
  }
}
// @@@SNIPEND

/**
 * Alternative implementation with cancellation from an outer scope.
 */
// @@@SNIPSTART typescript-cancel-a-timer-from-workflow-alternative-impl
export async function cancelTimerAltImpl(): Promise<void> {
  try {
    const scope = new CancellationScope();
    const promise = scope.run(() => sleep(1));
    scope.cancel(); // <-- Cancel the timer created in scope
    await promise; // <-- Throws CancelledFailure
  } catch (e) {
    if (e instanceof CancelledFailure) {
      console.log('Timer cancelled 👍');
    } else {
      throw e; // <-- Fail the workflow
    }
  }
}
// @@@SNIPEND

/**
 * Demonstrates how to clean up after cancellation.
 */
// @@@SNIPSTART typescript-handle-external-workflow-cancellation-while-activity-running
import { proxyActivities, isCancellation } from '@temporalio/workflow';

const { httpPostJSON, httpGetJSON, cleanup } = proxyActivities({
  startToCloseTimeout: '10m',
});

export async function handleExternalWorkflowCancellationWhileActivityRunning(url: string, data: any): Promise<void> {
  try {
    await httpPostJSON(url, data);
  } catch (err) {
    if (isCancellation(err)) {
      console.log('Workflow cancelled');
      // Cleanup logic must be in a nonCancellable scope
      // If we'd run cleanup outside of a nonCancellable scope it would've been cancelled
      // before being started because the Workflow's root scope is cancelled.
      await CancellationScope.nonCancellable(() => cleanup(url));
    }
    throw err; // <-- Fail the Workflow
  }
}
// @@@SNIPEND

// @@@SNIPSTART typescript-non-cancellable-shields-children
export async function nonCancellable(url: string): Promise<any> {
  // Prevent Activity from being cancelled and await completion.
  // Note that the Workflow is completely oblivious and impervious to cancellation in this example.
  return CancellationScope.nonCancellable(() => httpGetJSON(url));
}
// @@@SNIPEND

// @@@SNIPSTART typescript-multiple-activities-single-timeout-workflow
export function multipleActivitiesSingleTimeout(urls: string[], timeoutMs: number): Promise<any> {
  // If timeout triggers before all activities complete
  // the Workflow will fail with a CancelledError.
  return CancellationScope.withTimeout(timeoutMs, () => Promise.all(urls.map((url) => httpGetJSON(url))));
}
// @@@SNIPEND

/**
 * Demonstrates how to make Workflow aware of cancellation while waiting on nonCancellable scope.
 */
// @@@SNIPSTART typescript-cancel-requested-with-non-cancellable
export async function resumeAfterCancellation(url: string): Promise<any> {
  let result: any = undefined;
  const scope = new CancellationScope({ cancellable: false });
  const promise = scope.run(() => httpGetJSON(url));
  try {
    result = await Promise.race([scope.cancelRequested, promise]);
  } catch (err) {
    if (!(err instanceof CancelledFailure)) {
      throw err;
    }
    // Prevent Workflow from completing so Activity can complete
    result = await promise;
  }
  return result;
}
// @@@SNIPEND
/**
 * Demonstrates how to use cancellation scopes with callbacks.
 */
// @@@SNIPSTART typescript-cancellation-scopes-with-callbacks
function doSomething(callback: () => any) {
  setTimeout(callback, 10);
}

export async function cancellationScopesWithCallbacks(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    doSomething(resolve);
    CancellationScope.current().cancelRequested.catch(reject);
  });
}
// @@@SNIPEND
// @@@SNIPSTART typescript-shared-promise-scopes
export async function sharedScopes(): Promise<any> {
  // Start activities in the root scope
  const p1 = httpGetJSON('http://url1.ninja');
  const p2 = httpGetJSON('http://url2.ninja');

  const scopePromise = CancellationScope.cancellable(async () => {
    const first = await Promise.race([p1, p2]);
    // Does not cancel activity1 or activity2 as they're linked to the root scope
    CancellationScope.current().cancel();
    return first;
  });
  return await scopePromise;
  // The Activity that did not complete will effectively be cancelled when
  // Workflow completes unless the Activity is awaited:
  // await Promise.all([p1, p2]);
}
// @@@SNIPEND
// @@@SNIPSTART typescript-shield-awaited-in-root-scope
export async function shieldAwaitedInRootScope(): Promise<any> {
  let p: Promise<any> | undefined = undefined;

  await CancellationScope.nonCancellable(async () => {
    p = httpGetJSON('http://example.com'); // <-- Start activity in nonCancellable scope without awaiting completion
  });
  // Activity is shielded from cancellation even though it is awaited in the cancellable root scope
  return p;
}
// @@@SNIPEND
