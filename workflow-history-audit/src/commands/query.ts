import path from 'node:path';
import type { ExtractorOutputs } from '../extract.js';
import type { WorkflowTask } from '../extractors/workflow-tasks.js';
import { jsonFiles, readRunAnalysis, type RunAnalysis } from '../internal/history-storage.js';
import { parseQueryOptions, type QueryOptions } from './cli.js';

interface QuerySummary {
  scanned: number;
  matched: number;
}

async function main(): Promise<void> {
  try {
    const options = parseQueryOptions();
    if (!options) return;
    reportSummary(await queryAnalyses(options));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

async function queryAnalyses(options: QueryOptions): Promise<QuerySummary> {
  let scanned = 0;
  let matched = 0;

  for await (const file of jsonFiles(path.join(options.analysisDirectory, 'runs'))) {
    const run = await readRunAnalysis<ExtractorOutputs>(file);
    scanned++;

    const match = matchingRun(run, options);
    if (!match) continue;

    matched++;
    console.log(JSON.stringify(match));
  }

  return { scanned, matched };
}

function matchingRun(run: RunAnalysis<ExtractorOutputs>, options: QueryOptions): Record<string, unknown> | undefined {
  const tasks = matchingWorkflowTasks(run, options);
  if (tasks.length === 0) return undefined;
  const times = run.extractions.executionTimes;

  return {
    namespace: run.namespace,
    workflowId: run.workflowId,
    runId: run.runId,
    startTime: times?.startTime,
    closeTime: times?.closeTime,
    matchingWorkflowTasks: tasks,
  };
}

function matchingWorkflowTasks(run: RunAnalysis<ExtractorOutputs>, options: QueryOptions): WorkflowTask[] {
  return (run.extractions.workflowTasks ?? []).filter(
    (task) =>
      (!options.identity || task.identity === options.identity) &&
      (!options.buildId || task.buildId === options.buildId) &&
      taskInWindow(task, options.from, options.to),
  );
}

function taskInWindow(task: WorkflowTask, from?: string, to?: string): boolean {
  const beginning = task.startedAt ?? task.finishedAt;
  const ending = task.finishedAt ?? task.startedAt;
  return Boolean(
    beginning &&
      ending &&
      (!from || Date.parse(ending) >= Date.parse(from)) &&
      (!to || Date.parse(beginning) <= Date.parse(to)),
  );
}

function reportSummary(summary: QuerySummary): void {
  console.error(JSON.stringify(summary));
}

await main();
