import { pathToFileURL } from 'node:url';
import type { LoadedDataConverter, Payload } from '@temporalio/common';
import { mapAsyncIterable } from '@temporalio/client/lib/iterators-utils.js';
import { loadDataConverter } from '@temporalio/common/lib/internal-non-workflow/index.js';
import { historyFromJSON } from '@temporalio/common/lib/proto-utils.js';
import { dataConverter } from '../config.js';
import { extractors, type ExtractorOutputs } from '../extract.js';
import { CompositeExtractor, type ExecutionMetadata } from '../internal/history-extractor.js';
import {
  decodeHistoryPayloads,
  decodedEventPayloads,
  eventSerializationContext,
} from '../internal/history-payload-decoder.js';
import {
  analysisPath,
  atomicWrite,
  fileExists,
  jsonFiles,
  readHistoryEnvelope,
  type HistoryEnvelope,
  type RunAnalysis,
} from '../internal/history-storage.js';
import { parseAnalyzeOptions, type AnalyzeOptions } from './cli.js';

type AnalysisResult = { status: 'analyzed' | 'skipped' } | { status: 'failed'; file: string; error: unknown };

const ANALYSIS_BUFFER_LIMIT = 5;
const PROGRESS_INTERVAL_MS = 5_000;

async function main(): Promise<void> {
  const options = parseAnalyzeOptions();
  if (!options) return;

  const converter = loadDataConverter(dataConverter);

  const reporter = new AnalyzeReporter();
  try {
    reporter.started(options);

    await analyzeHistories(converter, options, reporter);
    reporter.finished();
  } catch (error) {
    reporter.failedWith(error);
  }
}

async function analyzeHistories(
  converter: LoadedDataConverter,
  options: AnalyzeOptions,
  reporter: AnalyzeReporter,
): Promise<void> {
  const analyses = mapAsyncIterable(
    jsonFiles(options.historiesDirectory),
    (file) => analyzeHistoryFile(converter, file, options),
    { concurrency: options.concurrency, bufferLimit: ANALYSIS_BUFFER_LIMIT },
  );

  for await (const result of analyses) {
    reporter.analysisFinished(result);
  }
}

async function analyzeHistoryFile(
  converter: LoadedDataConverter,
  historyFile: string,
  options: AnalyzeOptions,
): Promise<AnalysisResult> {
  try {
    const envelope = await readHistoryEnvelope(historyFile);

    const analysisFile = analysisPath(options.analysisDirectory, envelope.runId);
    if (await fileExists(analysisFile)) return { status: 'skipped' };

    const analysis = await analyzeHistory(converter, envelope);
    await atomicWrite(analysisFile, JSON.stringify(analysis, undefined, 2));

    return { status: 'analyzed' };
  } catch (error) {
    return { status: 'failed', file: historyFile, error };
  }
}

export async function analyzeHistory(
  converter: LoadedDataConverter,
  envelope: HistoryEnvelope,
): Promise<RunAnalysis<ExtractorOutputs>> {
  const history = historyFromJSON(envelope.history);
  const execution: ExecutionMetadata = {
    namespace: envelope.namespace,
    workflowId: envelope.workflowId,
    runId: envelope.runId,
    taskQueue: envelope.taskQueue,
  };
  const extraction = new CompositeExtractor(extractors, execution);
  const decoded = await decodeHistoryPayloads(history, converter.payloadCodecs, execution);

  for (const event of decoded.events ?? []) {
    const payloadToValue = <T = unknown>(payload: Payload): T =>
      converter.payloadConverter.fromPayload<T>(payload, event[eventSerializationContext]);
    extraction.onEvent({ event, payloads: event[decodedEventPayloads], payloadToValue });
  }

  return {
    kind: 'run-analysis',
    formatVersion: 1,
    namespace: envelope.namespace,
    workflowId: envelope.workflowId,
    runId: envelope.runId,
    taskQueue: envelope.taskQueue,
    extractions: extraction.finish(),
  };
}

class AnalyzeReporter {
  private readonly startedAt = Date.now();
  private processed = 0;
  private analyzed = 0;
  private skipped = 0;
  private failed = 0;
  private lastProgressAt = 0;
  private lastAnalyzed = 0;
  private progressTimer: ReturnType<typeof setInterval> | undefined;

  public started(options: AnalyzeOptions): void {
    this.lastProgressAt = Date.now();

    console.log('Analysis started:');
    console.log(`  Time: ${new Date(this.startedAt).toISOString()}`);
    console.log(`  Histories: ${options.historiesDirectory}`);
    console.log(`  Output: ${options.analysisDirectory}`);
    console.log('');

    this.reportProgress();
    this.progressTimer = setInterval(() => this.reportProgress(), PROGRESS_INTERVAL_MS);
    this.progressTimer.unref();
  }

  public analysisFinished(result: AnalysisResult): void {
    this.processed++;
    switch (result.status) {
      case 'analyzed':
        this.analyzed++;
        break;
      case 'skipped':
        this.skipped++;
        break;
      case 'failed':
        this.failed++;
        console.error(`Failed ${result.file}:`, result.error);
        break;
    }
  }

  public finished(): void {
    this.stopProgressReporting();
    if (this.processed > 0) this.reportProgress();
    console.log('');
    console.log('Analysis summary:');
    console.log(`  Processed: ${this.processed}`);
    console.log(`  Analyzed: ${this.analyzed}`);
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
    console.error(`Analysis failed after ${this.elapsedSeconds()}s`);
    process.exitCode = 1;
  }

  private elapsedSeconds(): string {
    return ((Date.now() - this.startedAt) / 1000).toFixed(1);
  }

  private reportProgress(): void {
    const now = Date.now();
    const secondsSinceLastProgress = (now - this.lastProgressAt) / 1000;
    const currentAnalysisRate =
      secondsSinceLastProgress > 0 ? (this.analyzed - this.lastAnalyzed) / secondsSinceLastProgress : 0;
    console.log(
      `Progress: ${this.processed} processed; ` +
        `${this.analyzed} analyzed, ${this.skipped} skipped, ${this.failed} failed; ` +
        `${currentAnalysisRate.toFixed(1)} analyses/s`,
    );
    this.lastProgressAt = now;
    this.lastAnalyzed = this.analyzed;
  }

  private stopProgressReporting(): void {
    if (this.progressTimer) clearInterval(this.progressTimer);
    this.progressTimer = undefined;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
