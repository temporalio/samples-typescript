/**
 * Temporal worker for the TypeScript triage workflow.
 *
 * Connects to Temporal Cloud, polls the task queue picked from TEMPORAL_TASK_QUEUE
 * (typically `triage-typescript`), registers both incidentTriageWorkflow and the
 * approvalWorkflow companion (re-exported from workflows/triage.ts), and the
 * triage activity.
 */
import { NativeConnection, Worker } from "@temporalio/worker";
import { fileURLToPath } from "node:url";
import * as triageActivities from "./activities/triage";

async function run(): Promise<void> {
  const address = process.env.TEMPORAL_ADDRESS;
  const namespace = process.env.TEMPORAL_NAMESPACE;
  const apiKey = process.env.TEMPORAL_API_KEY;
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "triage-typescript";

  if (!address || !namespace || !apiKey) {
    console.error("Missing TEMPORAL_ADDRESS / TEMPORAL_NAMESPACE / TEMPORAL_API_KEY");
    process.exit(1);
  }

  console.log(`connecting to ${address} (ns=${namespace}) on task queue ${taskQueue}`);

  const connection = await NativeConnection.connect({
    address,
    tls: {},
    metadata: { Authorization: `Bearer ${apiKey}` },
  });

  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue,
    workflowsPath: fileURLToPath(new URL("./workflows/triage.ts", import.meta.url)),
    activities: triageActivities,
  });

  console.log(`worker ready — polling ${taskQueue}`);
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
