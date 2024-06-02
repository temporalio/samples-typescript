import { ChildWorkflowHandle, continueAsNew, log, sleep, startChild, workflowInfo } from '@temporalio/workflow';

import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { Record } from './activities';
import { ApplicationFailure } from '@temporalio/workflow';

const { getRecords } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function processBatch(batch: Batch, previousExecutionResult?: Result): Promise<Result> {
  // load the records to process in this batch
  const records: Record[] = await getRecords(batch.pageSize, batch.offset);

  // Starts a child per record asynchronously.
  const handles: Array<ChildWorkflowHandle<any>> = await Promise.all(
    records.map((record) => {
      return startChild(recordProcessor, {
        workflowId: workflowInfo().workflowId + '/child-' + record.id,
        args: [record],
      });
    })
  );

  const totalProcessedRecords = previousExecutionResult
    ? previousExecutionResult.totalProcessedRecords + handles.length
    : handles.length;
  let failedRecords = previousExecutionResult ? previousExecutionResult.failedRecords : 0;
  //wait for all child workflows to complete or fail
  for (const handle of handles) {
    await handle.result().catch(() => {
      //intentionally failing 1/5 child workflows, track child workflows failures.
      failedRecords++;
    });
  }

  const executionResult = {
    totalProcessedRecords,
    failedRecords,
  };

  //Complete the workflow if there are no more record to process
  if (records.length == 0) {
    return executionResult;
  }

  //Continue as new to process the next batch
  return continueAsNew(
    {
      pageSize: batch.pageSize,
      offset: batch.offset + records.length,
    },
    executionResult
  );
}

export async function recordProcessor(record: Record): Promise<void> {
  log.info(`Processing record ${JSON.stringify(record)} in child workflow  `);

  //Sleep random time between 1000 and 2000 ms
  const maxSleep = 2000;
  const minSleep = 1000;

  await sleep(Math.floor(Math.random() * (maxSleep - minSleep + 1) + minSleep));

  //intentionally failing 1/5 child workflows
  if (record.id % 5 == 0) {
    throw ApplicationFailure.nonRetryable(
      `Intentionally failing the child workflow with input ${JSON.stringify(record)}`
    );
  }
}

export class Batch {
  public readonly pageSize: number;
  public readonly offset: number;

  constructor(pageSize: number, offset: number) {
    this.pageSize = pageSize;
    this.offset = offset;
  }
}

interface Result {
  totalProcessedRecords: number;
  failedRecords: number;
}
