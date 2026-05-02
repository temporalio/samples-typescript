# TypeScript: incident-triage tool-registry sample

Demonstrates `@temporalio/tool-registry` end-to-end: long-running `agenticSession` activity, MCP HTTP integration, human-in-the-loop via companion workflow, and a testable activity refactor.

## What's here

| File | Purpose |
|---|---|
| `types.ts` | `AlertPayload`, `TriageResult`, `ApprovalRequest`, `ApprovalResponse` types. |
| `activities/triage.ts` | The activity. `TriageDeps` interface, `buildTriageRegistry(alert, session, deps)` returning `{ registry, getResult }`, and the activity entrypoint that wires production deps. |
| `workflows/triage.ts` | Workflow that schedules the activity. |
| `workflows/approval.ts` | Companion HITL workflow: deterministic ID per alert, two signals, one query. |
| `worker.ts` | Worker registration. |
| `client.ts` | Demo client to start a workflow. |
| `triage_activity.test.ts` | Vitest unit tests demonstrating `MockProvider` + `TriageDeps` pattern. Run: `vitest run`. |

## Run

```bash
# 1. Temporal dev server (separate terminal)
temporal server start-dev

# 2. Env
export ANTHROPIC_API_KEY=sk-ant-...
export PROM_MCP=http://localhost:7070/mcp
export K8S_MCP=http://localhost:7071/mcp

# 3. Worker
npm run worker

# 4. Client
npm run start
```

## Requires

- `@temporalio/tool-registry` (currently the `feat/tool-registry` branch).
- `@anthropic-ai/sdk` peer dep.
