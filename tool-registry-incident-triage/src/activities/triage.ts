/**
 * triageIncidentActivity — the agentic loop.
 *
 * Opens an AgenticSession (heartbeat-checkpointed), wires up:
 *   - Prometheus tools sourced from the mcp-prometheus sidecar (localhost:7071)
 *   - Kubernetes tools sourced from the mcp-server-kubernetes sidecar (localhost:7072)
 *   - Per-language tools defined here: propose_remediation, request_human_approval,
 *     execute_remediation, report_resolved, report_unresolved
 *
 * The agent diagnoses the alert, proposes a remediation, requests human approval
 * (which signalWithStart's the companion approvalWorkflow), and — only if
 * approved — executes the remediation. Reports either resolved or unresolved.
 *
 * Structure:
 *   - `buildTriageRegistry()` returns the registry + a `getResult()` getter.
 *     Pure-ish: takes all I/O dependencies as injected functions so unit tests
 *     can substitute them.
 *   - `triageIncidentActivity()` opens the agenticSession, calls
 *     buildTriageRegistry with real deps, then runs the LLM loop.
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { Connection, Client } from "@temporalio/client";
import { WorkflowIdConflictPolicy } from "@temporalio/common";
import { ToolRegistry, agenticSession, type AgenticSession } from "@temporalio/tool-registry";
import {
  approvalWorkflow,
  approvalRequestSignal,
} from "../workflows/approval";
import type {
  AlertPayload,
  TriageResult,
  ProposedRemediation,
  ApprovalRequest,
  ApprovalResponse,
} from "../types";

const execAsync = promisify(exec);

const SYSTEM_PROMPT = `You are an SRE on-call agent triaging a production alert.

You have these tools (sourced from MCP sidecars + per-language helpers):
  - prometheus_query(query)            instant PromQL query
  - prometheus_query_range(query, start, end, step)
  - prometheus_alerts()                what is currently firing
  - kubectl_get(resource, namespace?)  list K8s resources
  - kubectl_describe(resource, name, namespace?)
  - kubectl_logs(pod, namespace, tail?)
  - propose_remediation(action, justification)   record but do NOT execute
  - request_human_approval(message, diagnosis, proposedAction)
                                       blocks until operator says approve|reject
  - execute_remediation(action)        ONLY callable AFTER approval was approved.
                                       Pass the same action you got approved.
  - report_resolved(summary)           ends the loop with status=resolved
  - report_unresolved(summary)         ends the loop with status=unresolved

Workflow:
  1. Read the alert. Use prometheus_query to confirm the symptom is currently true.
  2. Use kubectl_get/describe/logs and prometheus_query_range to find root cause.
  3. propose_remediation with a specific action (e.g., "kubectl rollout restart deploy/api -n demo-app").
  4. request_human_approval, attaching your diagnosis and the proposed action.
  5. If approved: execute_remediation, then prometheus_query to verify the symptom is gone, then report_resolved.
  6. If rejected: report_unresolved with the operator's reason.

Be terse. Conversation history is heartbeated to Temporal — keep tool inputs short.`;

// ── Injectable dependencies (override in tests) ────────────────────────────

export interface TriageDeps {
  /** Returns the tool catalog at the given MCP server URL. */
  mcpListTools: (baseUrl: string) => Promise<{ name: string; description?: string; inputSchema?: any }[]>;
  /** Calls a tool on the given MCP server URL, returns the (text-joined) result. */
  mcpCallTool: (baseUrl: string, name: string, args: Record<string, unknown>) => Promise<string>;
  /** Bridges request_human_approval to the companion approvalWorkflow. */
  requestHumanApproval: (alert: AlertPayload, request: ApprovalRequest) => Promise<ApprovalResponse>;
  /** Runs an approved kubectl/etc command. */
  execShellCommand: (cmd: string) => Promise<{ stdout: string; stderr: string }>;
}

export const defaultDeps: TriageDeps = {
  mcpListTools: async (baseUrl) => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    const json = await res.json() as any;
    if (json.error) throw new Error(`mcp tools/list ${baseUrl}: ${json.error.message}`);
    return json.result?.tools ?? [];
  },
  mcpCallTool: async (baseUrl, name, args) => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } }),
    });
    const json = await res.json() as any;
    if (json.error) return `MCP error: ${json.error.message}`;
    const blocks = json.result?.content ?? [];
    return blocks.map((b: any) => b.text ?? "").join("\n");
  },
  requestHumanApproval: realRequestHumanApproval,
  execShellCommand: async (cmd) => execAsync(cmd, { timeout: 60_000 }),
};

const PROM_MCP = process.env.MCP_PROMETHEUS_URL ?? "http://localhost:7071/";
const K8S_MCP = process.env.MCP_KUBERNETES_URL ?? "http://localhost:7072/";

// ── Registry builder (testable surface) ──────────────────────────────────────

/**
 * Build a populated `ToolRegistry` plus a `getResult()` accessor for the final
 * verdict. Pure modulo the injected `deps` — `MockProvider.runLoop(messages, registry)`
 * can drive the registry without any real MCP, Temporal, or shell dependency.
 */
export async function buildTriageRegistry(
  alert: AlertPayload,
  session: Pick<AgenticSession, "results">,
  deps: TriageDeps,
  endpoints: { promMcp: string; k8sMcp: string } = { promMcp: PROM_MCP, k8sMcp: K8S_MCP },
): Promise<{ registry: ToolRegistry; getResult: () => TriageResult | null }> {
  const registry = new ToolRegistry();

  // MCP-sourced tools.
  const promTools = await deps.mcpListTools(endpoints.promMcp).catch(() => []);
  const k8sTools = await deps.mcpListTools(endpoints.k8sMcp).catch(() => []);
  for (const t of promTools) {
    registry.define(
      { name: t.name, description: t.description ?? "", input_schema: t.inputSchema ?? { type: "object" } },
      (args) => deps.mcpCallTool(endpoints.promMcp, t.name, args),
    );
  }
  for (const t of k8sTools) {
    registry.define(
      { name: t.name, description: t.description ?? "", input_schema: t.inputSchema ?? { type: "object" } },
      (args) => deps.mcpCallTool(endpoints.k8sMcp, t.name, args),
    );
  }

  // Per-language tools.
  const remediations: ProposedRemediation[] = [];
  let approvedAction: string | null = null;
  let final: TriageResult | null = null;

  registry.define(
    {
      name: "propose_remediation",
      description: "Record a remediation you would apply. Does NOT execute it.",
      input_schema: {
        type: "object",
        properties: { action: { type: "string" }, justification: { type: "string" } },
        required: ["action", "justification"],
      },
    },
    (inp) => {
      const r = { action: String(inp.action), justification: String(inp.justification) };
      remediations.push(r);
      session.results.push({ kind: "remediation", ...r });
      return "recorded";
    },
  );

  registry.define(
    {
      name: "request_human_approval",
      description: "Block until operator decides. Returns JSON {decision, reason}.",
      input_schema: {
        type: "object",
        properties: {
          message: { type: "string" },
          diagnosis: { type: "string" },
          proposedAction: { type: "string" },
        },
        required: ["message", "diagnosis", "proposedAction"],
      },
    },
    async (inp) => {
      const req: ApprovalRequest = {
        message: String(inp.message),
        diagnosis: String(inp.diagnosis),
        proposedAction: String(inp.proposedAction),
      };
      const response = await deps.requestHumanApproval(alert, req);
      if (response.decision === "approved") {
        approvedAction = req.proposedAction;
      }
      session.results.push({ kind: "approval", ...response });
      return JSON.stringify(response);
    },
  );

  registry.define(
    {
      name: "execute_remediation",
      description: "Execute the previously-approved action. Errors if no approval has been granted.",
      input_schema: {
        type: "object",
        properties: { action: { type: "string" } },
        required: ["action"],
      },
    },
    async (inp) => {
      const action = String(inp.action);
      if (approvedAction === null) {
        return "ERROR: no approval has been granted. Call request_human_approval first.";
      }
      if (action !== approvedAction) {
        return `ERROR: requested action does not match approved action. Approved: ${approvedAction}`;
      }
      try {
        const { stdout, stderr } = await deps.execShellCommand(action);
        session.results.push({ kind: "executed", action, stdout: stdout.slice(0, 2000), stderr: stderr.slice(0, 2000) });
        return (stdout || stderr || "ok").slice(0, 4000);
      } catch (e: any) {
        return `EXEC ERROR: ${e.message}`;
      }
    },
  );

  registry.define(
    {
      name: "report_resolved",
      description: "Ends the loop with status=resolved.",
      input_schema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] },
    },
    (inp) => {
      final = { status: "resolved", summary: String(inp.summary), remediations };
      session.results.push({ kind: "final", ...final });
      return "ok";
    },
  );

  registry.define(
    {
      name: "report_unresolved",
      description: "Ends the loop with status=unresolved.",
      input_schema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] },
    },
    (inp) => {
      final = { status: "unresolved", summary: String(inp.summary), remediations };
      session.results.push({ kind: "final", ...final });
      return "ok";
    },
  );

  return { registry, getResult: () => final };
}

/** Build the initial user prompt the agent sees. */
export function buildPrompt(alert: AlertPayload): string {
  return (
    `Alert fired: ${alert.labels["alertname"]} on ${alert.labels["service"] ?? "unknown"}.\n` +
    `Summary: ${alert.annotations["summary"] ?? "(none)"}\n` +
    `Description: ${alert.annotations["description"] ?? "(none)"}\n` +
    `Runbook hint: ${alert.labels["runbook"] ?? "(none)"}\n\n` +
    `Investigate, propose, get approval, and either fix or report unresolved.`
  );
}

// ── Activity entrypoint ─────────────────────────────────────────────────────

export async function triageIncidentActivity(alert: AlertPayload, deps: TriageDeps = defaultDeps): Promise<TriageResult> {
  return agenticSession(async (session) => {
    const { registry, getResult } = await buildTriageRegistry(alert, session, deps);

    await session.runToolLoop({
      registry,
      provider: "anthropic",
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(alert),
    });

    const final = getResult();
    if (!final) {
      throw new Error("Agent ended the loop without calling report_resolved or report_unresolved");
    }
    return final;
  });
}

// ── Real HITL bridge ─────────────────────────────────────────────────────────

/**
 * signalWithStart's `approvalWorkflow` with deterministic ID per alert group.
 * Returns the operator's decision (decision/reason) which the agent observes
 * as the tool result.
 */
async function realRequestHumanApproval(alert: AlertPayload, request: ApprovalRequest): Promise<ApprovalResponse> {
  const apiKey = process.env.TEMPORAL_API_KEY;
  const address = process.env.TEMPORAL_ADDRESS;
  const namespace = process.env.TEMPORAL_NAMESPACE;
  if (!address || !namespace || !apiKey) {
    throw new Error("Missing TEMPORAL_ADDRESS/NAMESPACE/API_KEY for HITL bridge");
  }

  const connection = await Connection.connect({
    address,
    tls: {},
    metadata: { Authorization: `Bearer ${apiKey}` },
  });
  const client = new Client({ connection, namespace });

  const key = `${alert.labels["alertname"] ?? "unknown"}-${alert.labels["service"] ?? "unknown"}`;
  const approvalWorkflowId = `approval-${key.toLowerCase()}`;
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "triage-typescript";

  const handle = await client.workflow.signalWithStart(approvalWorkflow, {
    workflowId: approvalWorkflowId,
    taskQueue,
    args: [key],
    signal: approvalRequestSignal,
    signalArgs: [request],
    // If the activity retries while the approval workflow is still running,
    // attach to the existing one rather than starting a new approval. The
    // operator should not get a second prompt for the same incident.
    workflowIdConflictPolicy: WorkflowIdConflictPolicy.USE_EXISTING,
  });

  const response = (await handle.result()) as ApprovalResponse;
  await connection.close();
  return response;
}
