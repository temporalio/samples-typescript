# Workflow history audit example

This is a starting point for auditing selected values in workflow histories. Review and adapt the extraction rules before drawing conclusions from its results.

The downloader and analyzer are separate. The downloader needs Temporal Cloud access. The analyzer and query command run entirely on local files.

## Set up

Use Node.js 20.3 or later, then run `npm install` in this directory. Supply Temporal connection details through [SDK envconfig](https://docs.temporal.io/references/client-environment-configuration), for example with `TEMPORAL_CONFIG_FILE` and `TEMPORAL_PROFILE`, or the corresponding `TEMPORAL_*` environment variables. The download command also accepts `--profile` to select an envconfig profile and `--namespace` to override that profile's namespace. Do not put credentials in this repository.

The downloader uses a no-op payload converter and codec on its `Client` so payloads exposed through Client reads remain encoded. `fetchHistory()` returns the stored payload bytes without codec decoding. The downloader serializes those bytes to JSON, which represents them as base64. This Client is used only for reading. Edit [`src/config.ts`](src/config.ts) to use the **same payload converter and payload codecs as the workers whose histories are being analyzed**. The analyzer rehydrates the saved JSON into protobuf-backed objects and uses the SDK's internal payload visitor to apply codecs in reverse order. Codec-decoded fields remain Payloads; extractors convert them to application values as needed. Full decoded history payloads are never written to disk. A decoder must be available for every codec represented in the historical payloads. Edit [`src/extract.ts`](src/extract.ts) to register extractors and customize the application's data collection; the included `groupId` and `recordId` extractor is an example only.

## Project layout

- [`src/commands`](src/commands) contains the `download`, `analyze`, and `query` command entrypoints, plus their shared CLI argument definitions and help.
- [`src/config.ts`](src/config.ts) configures payload decoding for the application being audited.
- [`src/extract.ts`](src/extract.ts) registers extractor constructors under stable output keys and contains the example application extractor.
- [`src/extractors`](src/extractors) contains the built-in execution-time and Workflow Task extractors.
- [`src/internal`](src/internal) contains the extractor lifecycle, history storage, payload preservation, and request-rate limiting used by the commands.

Run any command with `--help` to see its arguments, defaults, and validation rules, for example `npm run download -- --help`.

## Download complete histories

```sh
npm run download -- \
  --filter-time-by overlap \
  --filter-time-start 2024-01-02T11:00Z \
  --filter-time-end 2024-01-02T21:00Z \
  --task-queue example-queue \
  --out ./audit-data \
  --rps 5 --concurrency 4
```

The generated Visibility query is equivalent to:

```text
TaskQueue = "example-queue" AND StartTime <= "2024-01-02T21:00Z" AND CloseTime >= "2024-01-02T11:00Z"
```

Both time bounds are inclusive. The default `overlap` mode includes closed executions that started before the window and closed after it. The `start` mode selects executions whose start time is within the interval, while `end` selects executions whose close time is within it. Executions still running when listed are excluded in every mode. Each complete run is stored as JSON under `audit-data/histories/<first-2-chars>/<next-2-chars>/<run-id>.json`. The two prefix directories keep the number of files in each directory manageable. The JSON envelope has `kind: "workflow-history"` and `formatVersion: 1`, plus the namespace, workflow ID, run ID, task queue, and a standard Temporal history JSON object in `history`. The metadata is retained because it is not all available from History itself and is needed for offline payload decoding and reporting.

The downloader first counts matching executions, then reports progress and the current history download rate immediately, every five seconds, and once more at completion. The connection's gRPC interceptor limits the start of all RPC attempts to `--rps` globally, including SDK retries and pages fetched internally by `count()`, `list()`, and `fetchHistory()`. Up to `--concurrency` histories download at a time. The query selects only executions with a close time. Each file is published by atomic rename. A repeat run skips existing files; failed downloads can be retried by running the same command again. Any failed results produce a nonzero exit code. Check the final `listed`, `saved`, `skipped`, and `failed` counts. Visibility is eventually consistent, so repeat after its indexing delay and compare the run count with an independent visibility count if completeness matters.

Compare the `listed` count with an independent Visibility count for the same query when completeness matters. Also check that the requested histories remain within retention.

## Analyze local histories

```sh
npm run analyze -- --histories ./audit-data --out ./audit-analysis
```

The analyzer traverses every history file and writes one JSON summary per run to `audit-analysis/runs`. Execution identity metadata stays at the top level. All traversal-derived data is produced by extractor instances and placed under `extractions`, using the registration key from `src/extract.ts`:

- `executionTimes` records the first and last event times.
- `workflowTasks` records started Workflow Task attempts and their `completed`, `failed`, or `timed-out` outcomes. It retains scheduling/start/finish event references, available timestamps, worker identity and Build ID, and failure cause or timeout type when applicable. Attempts without a terminal event remain `started`.
- `application` is an example extractor that collects group IDs and record IDs with their event IDs. It emits no output when none are found.

For example:

```json
{
  "kind": "run-analysis",
  "formatVersion": 1,
  "namespace": "example",
  "workflowId": "workflow-1",
  "runId": "run-1",
  "taskQueue": "example-queue",
  "extractions": {
    "executionTimes": {
      "startTime": "2024-01-02T11:00Z",
      "closeTime": "2024-01-02T21:00Z"
    },
    "workflowTasks": [],
    "application": {
      "groupIds": [{ "eventId": "1", "value": "group-A" }],
      "recordIds": []
    }
  }
}
```

An extractor implements [`HistoryExtractor`](src/internal/history-extractor.ts). Its constructor runs once per history and receives the execution metadata. `onEvent()` runs for each event in history order, including events without payloads. After traversal, `finish()` can aggregate, reshape, or filter its state and return any JSON-serializable result. Returning `undefined` omits that extractor's namespace; empty arrays, objects, and `null` are retained. Each extractor owns its state and result shape; the analyzer has no central observation collection and never merges extractor output objects.

Add or replace constructors in the `extractors` registry in `src/extract.ts`. Registration keys, not class names, define output namespaces. Built-in and application-specific extractors use the same lifecycle. Treat the supplied events and payloads as read-only so extractors remain independent.

Payload decoding uses workflow context for workflow inputs/results, the scheduled activity's context for activity inputs/results and failures, and the target workflow's context for external signals and child workflows. This matters if a codec uses serialization context. Each event callback receives its typed, codec-decoded event, a flat list of visited Payloads, and a `payloadToValue` function bound to the configured PayloadConverter and that event's serialization context. The list is attached to the event under the non-enumerable `decodedEventPayloads` symbol; events without payloads carry an empty list. Extractors decide which Payloads to convert to application values.

The analyzer streams history files from disk, analyzes up to `--concurrency` histories at a time, and reports progress and its current analysis rate immediately, every five seconds, and once more at completion. Existing analysis files are skipped. Use an empty output directory when rerunning after changing `src/extract.ts` or `src/config.ts`. A per-file failure does not stop the remaining histories, but any failure produces a nonzero exit code. Inspect each error and rerun after fixing it. Summaries contain only selected extracted values and event metadata, not decoded payload objects. Both encoded histories and extracted values may be sensitive; the tool creates files with mode `0600`.

Readers require the matching `kind` and `formatVersion: 1`. The unpublished format may still change; no compatibility layer is provided for earlier local files.

## Query the summaries

```sh
# Runs with a Workflow Task attempt associated with a particular worker during an interval:
npm run query -- --analysis ./audit-analysis \
  --identity 'worker-identity' \
  --from 2024-01-02T11:00Z --to 2024-01-02T21:00Z

# Runs with a workflow task using a particular Build ID:
npm run query -- --analysis ./audit-analysis --build-id 'worker-build-id'
```

Filters can be combined. The query command reads the default `workflowTasks` and `executionTimes` extractor outputs; keep those registrations or adapt the query alongside changes to those namespaces. Matching runs are printed as JSON lines to stdout; counts go to stderr. Failed and timed-out tasks participate in queries alongside completed tasks. `--from` and `--to` bound the available start/finish interval, not the overall run interval; if only one task timestamp is available, it is treated as a point. Worker identity comes from the start event when available, with worker-reported terminal metadata filling gaps. A server-generated `history-service` failure identity is not attributed to a worker. Build ID is recovered from start metadata when present, with reported completion/deployment metadata taking precedence. Some histories do not contain a Build ID. Matching task metadata does not prove that two runs were resident in the same process at the same instant, and whether a Build ID identifies an exact workflow bundle depends on the application's build ID scheme.

The default extractor only examines top-level `groupId` and `recordId` properties on decoded values; it does not recursively inspect application objects. Values that never reached history cannot be assessed. Activity completion results may be produced by activity workers; interpret them in their event context. Histories for child runs, continued-as-new runs, and other task queues require appropriate additional queries.
