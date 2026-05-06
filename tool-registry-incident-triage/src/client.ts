/**
 * Client CLI for the TypeScript triage workers.
 *
 * Usage:
 *   tsx client.ts pending                       # list pending approval workflows
 *   tsx client.ts approve <workflow-id> <reason>
 *   tsx client.ts reject  <workflow-id> <reason>
 *   tsx client.ts trigger <alertname> <service> # post a synthetic alert (skips webhook)
 */
import { Client, Connection, type WorkflowExecutionInfo } from "@temporalio/client";
import {
  incidentTriageWorkflow,
  alertUpdateSignal,
} from "./workflows/triage";
import {
  approvalDecisionSignal,
  pendingApprovalQuery,
} from "./workflows/approval";
import type { AlertPayload } from "./types";

async function makeClient(): Promise<Client> {
  const address = process.env.TEMPORAL_ADDRESS!;
  const namespace = process.env.TEMPORAL_NAMESPACE!;
  const apiKey = process.env.TEMPORAL_API_KEY!;
  if (!address || !namespace || !apiKey) {
    throw new Error("Missing TEMPORAL_ADDRESS / TEMPORAL_NAMESPACE / TEMPORAL_API_KEY");
  }
  const connection = await Connection.connect({
    address,
    tls: {},
    metadata: { Authorization: `Bearer ${apiKey}` },
  });
  return new Client({ connection, namespace });
}

async function pending(): Promise<void> {
  const client = await makeClient();
  // Look for running approval-* workflows
  const iter = client.workflow.list({ query: 'WorkflowType="approvalWorkflow" AND ExecutionStatus="Running"' });
  let any = false;
  for await (const wf of iter as AsyncIterable<WorkflowExecutionInfo>) {
    any = true;
    const handle = client.workflow.getHandle(wf.workflowId);
    const req = await handle.query(pendingApprovalQuery).catch(() => null);
    console.log(`\n${wf.workflowId} (${wf.startTime?.toISOString?.()})`);
    if (req) {
      console.log(`  message:  ${req.message}`);
      console.log(`  diagnosis: ${req.diagnosis}`);
      console.log(`  proposed:  ${req.proposedAction}`);
      console.log(`  approve:   tsx client.ts approve ${wf.workflowId} "<reason>"`);
      console.log(`  reject:    tsx client.ts reject  ${wf.workflowId} "<reason>"`);
    } else {
      console.log("  (workflow exists but agent has not requested approval yet)");
    }
  }
  if (!any) console.log("(no pending approval workflows)");
}

async function decide(decision: "approved" | "rejected", workflowId: string, reason: string): Promise<void> {
  const client = await makeClient();
  const handle = client.workflow.getHandle(workflowId);
  await handle.signal(approvalDecisionSignal, { decision, reason });
  console.log(`signaled ${workflowId}: ${decision} — ${reason}`);
}

async function trigger(alertname: string, service: string): Promise<void> {
  const client = await makeClient();
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "triage-typescript";
  const workflowId = `triage-${alertname.toLowerCase()}-${service.toLowerCase()}`;
  const alert: AlertPayload = {
    status: "firing",
    labels: { alertname, service, severity: "critical", runbook: "synthetic" },
    annotations: {
      summary: `Synthetic test alert for ${service}`,
      description: `Triggered manually via 'client.ts trigger' to exercise the triage flow.`,
    },
    startsAt: new Date().toISOString(),
  };
  const handle = await client.workflow.signalWithStart(incidentTriageWorkflow, {
    workflowId,
    taskQueue,
    args: [alert],
    signal: alertUpdateSignal,
    signalArgs: [alert],
  });
  console.log(`started triage workflow: ${handle.workflowId} on ${taskQueue}`);
}

const [, , cmd, ...args] = process.argv;

(async () => {
  switch (cmd) {
    case "pending":
      await pending();
      break;
    case "approve":
      if (args.length < 2) throw new Error("Usage: client.ts approve <wfid> <reason>");
      await decide("approved", args[0]!, args.slice(1).join(" "));
      break;
    case "reject":
      if (args.length < 2) throw new Error("Usage: client.ts reject <wfid> <reason>");
      await decide("rejected", args[0]!, args.slice(1).join(" "));
      break;
    case "trigger":
      if (args.length < 2) throw new Error("Usage: client.ts trigger <alertname> <service>");
      await trigger(args[0]!, args[1]!);
      break;
    default:
      console.error("Usage: tsx client.ts <pending|approve|reject|trigger>");
      process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
