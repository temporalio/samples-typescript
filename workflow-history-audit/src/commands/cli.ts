import { parseArgs } from 'node:util';
import type { ConnectionOptions } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';

////////////////////////////////////////////////////////////////////////////////////////////////////
// download
////////////////////////////////////////////////////////////////////////////////////////////////////

const downloadHelp = `Usage: npm run download -- [options]

Download complete Workflow histories selected by an inclusive UTC interval
and optional task queue. Configure the Temporal connection as described at:
https://docs.temporal.io/references/client-environment-configuration

Connection options:
  --profile <name>         Env Config profile to load (default: default)
  --namespace <namespace>  Override the namespace from the envconfig profile

History selection options:
  --task-queue <name>             Task queue used to select Workflow Executions
  --filter-time-by <mode>         Filter by start, end, or overlap (default: overlap)
  --filter-time-start <timestamp> Inclusive interval start as ISO 8601 with a timezone
  --filter-time-end <timestamp>   Inclusive interval end as ISO 8601 with a timezone

Time filter modes:
  start    Workflow start time is within the interval
  end      Workflow close time is within the interval
  overlap  Workflow lifetime overlaps the interval

Storage options:
  --out <directory>        Directory where histories will be written

Performance options:
  --rps <number>           Maximum gRPC requests per second (default: 40)
  --concurrency <number>   Maximum concurrent history downloads (default: 10)

Other options:
  -h, --help               Show this help

Failed downloads produce a nonzero exit status.
Existing history files are skipped.
`;

export interface DownloadOptions {
  readonly connectionOptions: ConnectionOptions;
  readonly namespace: string;

  readonly visibilityQuery: string;

  readonly historiesDirectory: string;

  readonly requestsPerSecond: number;
  readonly concurrency: number;
}

type FilterTimeBy = 'start' | 'end' | 'overlap';

export function parseDownloadOptions(args = process.argv.slice(2)): DownloadOptions | undefined {
  try {
    const { values } = parseArgs({
      args,
      options: {
        'filter-time-by': { type: 'string', default: 'overlap' },
        'filter-time-start': { type: 'string' },
        'filter-time-end': { type: 'string' },
        'task-queue': { type: 'string' },
        out: { type: 'string' },
        profile: { type: 'string' },
        namespace: { type: 'string' },
        rps: { type: 'string', default: '40' },
        concurrency: { type: 'string', default: '10' },
        help: { type: 'boolean', short: 'h' },
      },
    });
    if (values.help) {
      console.error(downloadHelp);
      return undefined;
    }

    const filterTimeBy = parseFilterTimeBy(requiredFlag(values, 'filter-time-by'));
    const start = utcTimestamp(requiredFlag(values, 'filter-time-start'));
    const end = utcTimestamp(requiredFlag(values, 'filter-time-end'));
    if (start > end) throw new Error('--filter-time-start must be no later than --filter-time-end');
    const taskQueue = values['task-queue'];
    const config = loadClientConnectConfig({ profile: values.profile });

    return {
      visibilityQuery: buildVisibilityQuery(taskQueue, filterTimeBy, start, end),
      historiesDirectory: requiredFlag(values, 'out'),
      connectionOptions: config.connectionOptions,
      namespace: values.namespace ?? config.namespace ?? 'default',
      requestsPerSecond: positiveInteger(requiredFlag(values, 'rps'), 'rps'),
      concurrency: positiveInteger(requiredFlag(values, 'concurrency'), 'concurrency'),
    };
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exitCode = 1;
    return undefined;
  }
}

function parseFilterTimeBy(value: string): FilterTimeBy {
  if (value === 'start' || value === 'end' || value === 'overlap') return value;
  throw new Error('--filter-time-by must be start, end, or overlap');
}

function buildVisibilityQuery(
  taskQueue: string | undefined,
  filterTimeBy: FilterTimeBy,
  start: string,
  end: string,
): string {
  const taskQueuePredicate = taskQueue ? `TaskQueue = ${JSON.stringify(taskQueue)} AND ` : '';
  switch (filterTimeBy) {
    case 'start':
      // The trailing CloseTime comparison filters out executions that are still running.
      return (
        taskQueuePredicate +
        `StartTime >= ${JSON.stringify(start)} AND StartTime <= ${JSON.stringify(end)} ` +
        `AND CloseTime IS NOT NULL`
      );
    case 'end':
      return taskQueuePredicate + `CloseTime >= ${JSON.stringify(start)} AND CloseTime <= ${JSON.stringify(end)}`;
    case 'overlap':
      return taskQueuePredicate + `StartTime <= ${JSON.stringify(end)} AND CloseTime >= ${JSON.stringify(start)}`;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// analyze
////////////////////////////////////////////////////////////////////////////////////////////////////

const analyzeHelp = `Usage: npm run analyze -- --histories <directory> --out <directory>

Analyze downloaded histories using the payload converter in src/config.ts
and extractor constructors registered in src/extract.ts.

Required options:
  --histories <directory>  Directory containing the downloaded histories/ directory
  --out <directory>        Directory where per-run analysis files will be written

Performance options:
  --concurrency <number>   Maximum concurrent history analyses (default: 10)

Other options:
  -h, --help               Show this help

Failed analyses produce a nonzero exit status.
Existing analysis files are skipped.
`;

export interface AnalyzeOptions {
  readonly historiesDirectory: string;
  readonly analysisDirectory: string;

  readonly concurrency: number;
}

export function parseAnalyzeOptions(args = process.argv.slice(2)): AnalyzeOptions | undefined {
  try {
    const { values } = parseArgs({
      args,
      options: {
        histories: { type: 'string' },
        out: { type: 'string' },
        concurrency: { type: 'string', default: '10' },
        help: { type: 'boolean', short: 'h' },
      },
    });
    if (values.help) {
      console.error(analyzeHelp);
      return undefined;
    }

    return {
      historiesDirectory: requiredFlag(values, 'histories'),
      analysisDirectory: requiredFlag(values, 'out'),
      concurrency: positiveInteger(requiredFlag(values, 'concurrency'), 'concurrency'),
    };
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exitCode = 1;
    return undefined;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// query
////////////////////////////////////////////////////////////////////////////////////////////////////

const queryHelp = `Usage: npm run query -- --analysis <directory> [filters]

Search the per-run summaries produced by the analyze command. Matching runs are written
as JSON lines to stdout; scan and match counts are written to stderr.

Required options:
  --analysis <directory>   Directory containing the analyzed runs/ directory

At least one filter is required:
  --identity <identity>    Match Workflow Task attempts associated with this worker identity
  --build-id <build-id>    Match Workflow Task attempts reported with this Build ID

Time filters:
  --from <timestamp>       Match Workflow Task intervals ending at or after this timestamp
  --to <timestamp>         Match Workflow Task intervals starting at or before this timestamp
                           Timestamps must be ISO 8601 with a timezone.

Other options:
  -h, --help               Show this help
`;

export interface QueryOptions {
  analysisDirectory: string;
  identity?: string;
  buildId?: string;
  from?: string;
  to?: string;
}

export function parseQueryOptions(args = process.argv.slice(2)): QueryOptions | undefined {
  const { values } = parseArgs({
    args,
    options: {
      analysis: { type: 'string' },
      identity: { type: 'string' },
      'build-id': { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(queryHelp);
    return undefined;
  }
  if (!values.identity && !values['build-id']) {
    throw new Error('Specify --identity or --build-id');
  }

  const from = values.from && utcTimestamp(values.from);
  const to = values.to && utcTimestamp(values.to);
  if (from && to && from > to) throw new Error('--from must be no later than --to');

  return {
    analysisDirectory: requiredFlag(values, 'analysis'),
    identity: values.identity,
    buildId: values['build-id'],
    from,
    to,
  };
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// CLI parsing utils
////////////////////////////////////////////////////////////////////////////////////////////////////

function requiredFlag(flags: Record<string, string | boolean | undefined>, name: string): string {
  const value = flags[name];
  if (typeof value !== 'string' || !value) throw new Error(`Missing --${name}`);
  return value;
}

function positiveInteger(value: string, name: string): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return number;
}

function utcTimestamp(text: string): string {
  const date = new Date(text);
  if (!Number.isFinite(date.getTime()) || !/[zZ]|[+-]\d\d:\d\d$/.test(text)) {
    throw new Error(`Expected an ISO 8601 timestamp with timezone: ${text}`);
  }
  return date.toISOString();
}
