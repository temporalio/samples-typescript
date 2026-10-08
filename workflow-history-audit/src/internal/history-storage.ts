import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * A Temporal History and the execution metadata needed for offline analysis.
 *
 * History does not contain its namespace, Workflow ID, or Run ID. Keeping that
 * metadata in an envelope lets payload codecs receive the correct serialization
 * context without requiring access to the Temporal Service during analysis.
 */
export interface HistoryEnvelope {
  kind: 'workflow-history';
  formatVersion: 1;
  namespace: string;
  workflowId: string;
  runId: string;
  taskQueue: string;
  history: { events: HistoryEventJson[] };
}

/**
 * The on-disk analysis envelope. After publication, changes to its fixed fields
 * require a formatVersion bump.
 */
export interface RunAnalysis<Extractions extends Record<string, unknown> = Record<string, unknown>> {
  kind: 'run-analysis';
  formatVersion: 1;
  namespace: string;
  workflowId: string;
  runId: string;
  taskQueue: string;
  extractions: Extractions;
}

export interface HistoryEventJson {
  eventId: string;
  eventType: string;
  eventTime?: string;
  [key: string]: unknown;
}

export function historyPath(root: string, runId: string): string {
  return path.join(root, 'histories', runId.slice(0, 2), runId.slice(2, 4), `${runId}.json`);
}

export function analysisPath(root: string, runId: string): string {
  return path.join(root, 'runs', runId.slice(0, 2), runId.slice(2, 4), `${runId}.json`);
}

export async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function atomicWrite(file: string, contents: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, contents, { flag: 'wx', mode: 0o600 });
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function* jsonFiles(root: string): AsyncGenerator<string> {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) yield* jsonFiles(file);
    else if (entry.isFile() && entry.name.endsWith('.json')) yield file;
  }
}

export async function readHistoryEnvelope(file: string): Promise<HistoryEnvelope> {
  const envelope: unknown = JSON.parse(await readFile(file, 'utf8'));
  if (
    !isRecord(envelope) ||
    envelope.kind !== 'workflow-history' ||
    envelope.formatVersion !== 1 ||
    !hasExecutionFields(envelope) ||
    !isRecord(envelope.history) ||
    !Array.isArray(envelope.history.events)
  ) {
    throw new Error(`Invalid workflow-history v1 envelope: ${file}`);
  }
  return envelope as unknown as HistoryEnvelope;
}

export async function readRunAnalysis<Extractions extends Record<string, unknown> = Record<string, unknown>>(
  file: string,
): Promise<RunAnalysis<Extractions>> {
  const analysis: unknown = JSON.parse(await readFile(file, 'utf8'));
  if (
    !isRecord(analysis) ||
    analysis.kind !== 'run-analysis' ||
    analysis.formatVersion !== 1 ||
    !hasExecutionFields(analysis) ||
    !isRecord(analysis.extractions)
  ) {
    throw new Error(`Invalid run-analysis v1 envelope: ${file}. Rerun analyze with an empty output directory.`);
  }
  return analysis as unknown as RunAnalysis<Extractions>;
}

function hasExecutionFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.namespace === 'string' &&
    typeof value.workflowId === 'string' &&
    typeof value.runId === 'string' &&
    typeof value.taskQueue === 'string'
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
