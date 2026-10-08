import { pathToFileURL } from 'node:url';
import { Client, Connection, type WorkflowExecutionInfo } from '@temporalio/client';
import { defaultGrpcRetryOptions, makeGrpcRetryInterceptor } from '@temporalio/client/lib/grpc-retry.js';
import { mapAsyncIterable } from '@temporalio/client/lib/iterators-utils.js';
import { historyToJSON } from '@temporalio/common/lib/proto-utils.js';
import { noopDataConverter } from '../internal/noop-data-converter.js';
import { makeGrpcRpsInterceptor } from '../internal/grpc-rate-limit-interceptor.js';
import { atomicWrite, fileExists, historyPath, type HistoryEnvelope } from '../internal/history-storage.js';
import { parseDownloadOptions, type DownloadOptions } from './cli.js';

type DownloadResult =
  | { status: 'saved' | 'skipped' }
  | { status: 'failed'; workflowId: string; runId: string; error: unknown };

const DOWNLOAD_BUFFER_LIMIT = 5;
const PROGRESS_INTERVAL_MS = 5_000;

async function main(): Promise<void> {
  const options = parseDownloadOptions();
  if (!options) return;

  const reporter = new DownloadReporter();
  try {
    const client = await connectClient(options);
    try {
      const { count } = await client.workflow.count(options.visibilityQuery);
      reporter.started(options, count);

      await downloadHistories(client, options, reporter);
    } finally {
      await client.connection.close();
    }
    reporter.finished();
  } catch (error) {
    reporter.failedWith(error);
  }
}

async function connectClient(options: DownloadOptions): Promise<Client> {
  const connection = await Connection.connect({
    ...options.connectionOptions,
    interceptors: [
      // Retry on gRPC request errors
      makeGrpcRetryInterceptor(defaultGrpcRetryOptions()),
      // Limit RPS to the server
      makeGrpcRpsInterceptor(options.requestsPerSecond),
    ],
  });
  return new Client({ connection, namespace: options.namespace, dataConverter: noopDataConverter });
}

async function downloadHistories(client: Client, options: DownloadOptions, reporter: DownloadReporter): Promise<void> {
  // TODO: Replace this internal helper when list().intoHistories() supports filtering or mapping.
  const downloads = mapAsyncIterable(
    client.workflow.list({ query: options.visibilityQuery, pageSize: 500 }),
    (execution) => downloadHistory(client, execution, options),
    { concurrency: options.concurrency, bufferLimit: DOWNLOAD_BUFFER_LIMIT },
  );

  for await (const result of downloads) {
    reporter.downloadFinished(result);
  }
}

async function downloadHistory(
  client: Client,
  execution: WorkflowExecutionInfo,
  options: DownloadOptions,
): Promise<DownloadResult> {
  const { workflowId, runId } = execution;
  const historyFile = historyPath(options.historiesDirectory, runId);

  try {
    if (await fileExists(historyFile)) return { status: 'skipped' };

    // fetchHistory paginates internally and returns the stored, codec-encoded payloads.
    const rawHistory = await client.workflow.getHandle(workflowId, runId).fetchHistory();
    const envelope: HistoryEnvelope = {
      kind: 'workflow-history',
      formatVersion: 1,
      namespace: options.namespace,
      workflowId,
      runId,
      taskQueue: execution.taskQueue,
      history: JSON.parse(historyToJSON(rawHistory)),
    };

    await atomicWrite(historyFile, JSON.stringify(envelope, undefined, 2));

    return { status: 'saved' };
  } catch (error) {
    return { status: 'failed', workflowId, runId, error };
  }
}

class DownloadReporter {
  private readonly startedAt = Date.now();
  private total = 0;
  private listed = 0;
  private saved = 0;
  private skipped = 0;
  private failed = 0;
  private lastProgressAt = 0;
  private lastSaved = 0;
  private progressTimer: ReturnType<typeof setInterval> | undefined;

  public started(options: DownloadOptions, total: number): void {
    this.total = total;
    this.lastProgressAt = Date.now();

    console.log('Download started:');
    console.log(`  Time: ${new Date(this.startedAt).toISOString()}`);
    console.log(`  Namespace: ${options.namespace}`);
    console.log(`  Query: ${options.visibilityQuery}`);
    console.log(`  Matching executions: ${total}`);
    console.log('');

    this.reportProgress();
    this.progressTimer = setInterval(() => this.reportProgress(), PROGRESS_INTERVAL_MS);
    this.progressTimer.unref();
  }

  public downloadFinished(result: DownloadResult): void {
    this.listed++;
    switch (result.status) {
      case 'saved':
        this.saved++;
        break;
      case 'skipped':
        this.skipped++;
        break;
      case 'failed':
        this.failed++;
        console.error(`Failed ${result.workflowId}/${result.runId}:`, result.error);
        break;
    }
  }

  public finished(): void {
    this.stopProgressReporting();
    if (this.listed > 0) this.reportProgress();
    console.log('');
    console.log('Download summary:');
    console.log(`  Listed: ${this.listed}`);
    console.log(`  Saved: ${this.saved}`);
    console.log(`  Skipped: ${this.skipped}`);
    console.log(`  Failed: ${this.failed}`);
    console.log('');
    console.log(`  Duration: ${this.elapsedSeconds()}s`);
    console.log('');

    if (this.failed > 0) process.exitCode = 1;
  }

  public failedWith(error: unknown): void {
    this.stopProgressReporting();
    console.error(error);
    console.error(`Download failed after ${this.elapsedSeconds()}s`);
    process.exitCode = 1;
  }

  private elapsedSeconds(): string {
    return ((Date.now() - this.startedAt) / 1000).toFixed(1);
  }

  private reportProgress(): void {
    const now = Date.now();
    const secondsSinceLastProgress = (now - this.lastProgressAt) / 1000;
    const currentDownloadRate =
      secondsSinceLastProgress > 0 ? (this.saved - this.lastSaved) / secondsSinceLastProgress : 0;
    console.log(
      `Progress: ${this.listed}/${this.total} processed; ` +
        `${this.saved} saved, ${this.skipped} skipped, ${this.failed} failed; ` +
        `${currentDownloadRate.toFixed(1)} downloads/s`,
    );
    this.lastProgressAt = now;
    this.lastSaved = this.saved;
  }

  private stopProgressReporting(): void {
    if (this.progressTimer) clearInterval(this.progressTimer);
    this.progressTimer = undefined;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
