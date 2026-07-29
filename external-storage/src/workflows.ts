import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import type { Document, ProcessingResult } from './shared';

const { extractText, summarize } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/**
 * Ordinary Workflow code. Nothing in it refers to external storage, and that is the
 * point: offloading is a DataConverter concern, so turning it on does not change how a
 * Workflow is written.
 *
 * Four payloads cross a process boundary here, and each is offloaded or inlined purely
 * on its own size:
 *
 * 1. `document` — stored by the *Client* before it calls StartWorkflowExecution, and
 *    retrieved by the Worker before this function is first invoked.
 * 2. the `extractText` argument — stored by the Worker when it completes the Workflow
 *    Task carrying the ScheduleActivityTask command, and retrieved by whichever Worker
 *    picks up that Activity Task. On a multi-Worker Task Queue that is usually a
 *    different process, which is why the blobs have to be somewhere shared.
 * 3. the `extractText` result — stored when the Activity completes, retrieved when the
 *    result is delivered into this Workflow's next activation.
 * 4. the return value below — stored when the Workflow completes, retrieved by the
 *    Client in `handle.result()`.
 *
 * The `summarize` result is small, so it stays inline and never touches the driver.
 *
 * Note that no driver code runs inside the Workflow sandbox: the sandbox has no I/O,
 * and store/retrieve happen in Worker code on either side of the activation.
 */
export async function processDocument(document: Document): Promise<ProcessingResult> {
  const extractedText = await extractText(document);
  const summary = await summarize(extractedText);

  // Returning a large result is only practical *because* of external storage; inline it
  // would run into Temporal's per-payload size limit. Small results are still the
  // better default, since every Client that reads this one pays a storage round trip.
  // The alternative is to return a claim of your own (an object key, a row ID) and let
  // callers fetch the bulk themselves, at the cost of doing by hand exactly what the
  // driver already does.
  return { documentName: document.name, summary, extractedText };
}
