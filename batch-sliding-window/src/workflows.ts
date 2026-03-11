import {
  ApplicationFailure,
  condition,
  continueAsNew,
  defineQuery,
  defineSignal,
  executeChild,
  getExternalWorkflowHandle,
  log,
  ParentClosePolicy,
  proxyActivities,
  setHandler,
  sleep,
  startChild,
  workflowInfo,
} from '@temporalio/workflow';
import type { createActivities, SingleRecord } from './activities';

const { getRecordCount, getRecords } = proxyActivities<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '5 seconds',
});

// --- Types ---

export interface ProcessBatchWorkflowInput {
  pageSize: number;
  slidingWindowSize: number;
  partitions: number;
}

export interface SlidingWindowWorkflowInput {
  pageSize: number;
  slidingWindowSize: number;
  offset: number;
  maximumOffset: number;
  progress: number;
  currentRecords: Record<string, boolean> | null;
}

export interface SlidingWindowState {
  currentRecords: number[];
  childrenStartedByThisRun: number;
  offset: number;
  progress: number;
}

// --- Signals and Queries ---

export const reportCompletionSignal = defineSignal<[number]>('reportCompletion');
export const stateQuery = defineQuery<SlidingWindowState>('state');

// --- Helpers ---

function divideIntoPartitions(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const remainder = total % n;
  const partitions = new Array<number>(n).fill(base);
  for (let i = 0; i < remainder; i++) {
    partitions[i] += 1;
  }
  return partitions;
}

// --- Workflows ---

/**
 * Top-level batch workflow. Partitions the record range across multiple
 * parallel SlidingWindowWorkflows, waits for all to complete, and returns
 * the total number of processed records.
 */
export async function processBatchWorkflow(input: ProcessBatchWorkflowInput): Promise<number> {
  const totalRecords = await getRecordCount();

  if (input.slidingWindowSize < input.partitions) {
    throw ApplicationFailure.nonRetryable('SlidingWindowSize cannot be less than number of partitions');
  }

  const partitionSizes = divideIntoPartitions(totalRecords, input.partitions);
  const windowSizes = divideIntoPartitions(input.slidingWindowSize, input.partitions);

  log.info('ProcessBatchWorkflow started', {
    input,
    totalRecords,
    partitionSizes,
    windowSizes,
  });

  const childPromises: Promise<number>[] = [];
  let offset = 0;

  for (let i = 0; i < input.partitions; i++) {
    const childId = `${workflowInfo().workflowId}/${i}`;
    const maximumPartitionOffset = Math.min(offset + partitionSizes[i], totalRecords);

    const childInput: SlidingWindowWorkflowInput = {
      pageSize: input.pageSize,
      slidingWindowSize: windowSizes[i],
      offset,
      maximumOffset: maximumPartitionOffset,
      progress: 0,
      currentRecords: null,
    };

    childPromises.push(
      executeChild(slidingWindowWorkflow, {
        workflowId: childId,
        args: [childInput],
      }),
    );

    offset += partitionSizes[i];
  }

  const results = await Promise.all(childPromises);
  return results.reduce((sum, r) => sum + r, 0);
}

/**
 * Processes a contiguous range of records using a sliding window of child
 * RecordProcessorWorkflows. Keeps up to slidingWindowSize children running
 * at once; when one completes (via reportCompletion signal) a new one starts.
 * Calls continue-as-new after each page to bound history size.
 */
export async function slidingWindowWorkflow(input: SlidingWindowWorkflowInput): Promise<number> {
  const currentRecords: Record<string, boolean> = input.currentRecords ?? {};
  let progress = input.progress;
  let childrenStartedCount = 0;

  log.info('SlidingWindowWorkflow started', {
    slidingWindowSize: input.slidingWindowSize,
    pageSize: input.pageSize,
    offset: input.offset,
    maximumOffset: input.maximumOffset,
    progress,
  });

  setHandler(stateQuery, () => ({
    currentRecords: Object.keys(currentRecords)
      .map(Number)
      .sort((a, b) => a - b),
    childrenStartedByThisRun: childrenStartedCount,
    offset: input.offset,
    progress,
  }));

  setHandler(reportCompletionSignal, (recordId: number) => {
    const key = String(recordId);
    if (key in currentRecords) {
      delete currentRecords[key];
      progress++;
    }
  });

  // Load the next page of records (skip if we've reached the end)
  let records: SingleRecord[] = [];
  if (input.offset < input.maximumOffset) {
    const output = await getRecords({
      pageSize: input.pageSize,
      offset: input.offset,
      maxOffset: input.maximumOffset,
    });
    records = output.records;
  }

  const myWorkflowId = workflowInfo().workflowId;

  for (const record of records) {
    // Block until a slot opens in the sliding window
    await condition(() => Object.keys(currentRecords).length < input.slidingWindowSize);

    const childId = `${myWorkflowId}/${record.id}`;
    currentRecords[String(record.id)] = true;

    // startChild resolves once the server accepts the child start request,
    // equivalent to Go's child.GetChildWorkflowExecution().Get()
    await startChild(recordProcessorWorkflow, {
      workflowId: childId,
      parentClosePolicy: ParentClosePolicy.ABANDON,
      args: [record],
    });

    childrenStartedCount++;
  }

  // Continue-as-new or complete
  const newOffset = input.offset + childrenStartedCount;

  if (newOffset < input.maximumOffset) {
    await continueAsNew<typeof slidingWindowWorkflow>({
      pageSize: input.pageSize,
      slidingWindowSize: input.slidingWindowSize,
      offset: newOffset,
      maximumOffset: input.maximumOffset,
      progress,
      currentRecords,
    });
  }

  // Last run: wait for all outstanding children to complete
  await condition(() => Object.keys(currentRecords).length === 0);
  return progress;
}

/**
 * Processes a single record (simulated with a deterministic sleep),
 * then signals the parent SlidingWindowWorkflow that it has completed.
 * Signals by workflow ID only (no run ID) so the signal reaches the
 * latest run even after the parent has called continue-as-new.
 */
export async function recordProcessorWorkflow(record: SingleRecord): Promise<void> {
  const sleepMs = ((record.id % 10) + 1) * 1000;
  await sleep(sleepMs);

  log.info('Processed record', { recordId: record.id });

  const parent = workflowInfo().parent;
  if (parent) {
    const handle = getExternalWorkflowHandle(parent.workflowId);
    await handle.signal(reportCompletionSignal, record.id);
  }
}
