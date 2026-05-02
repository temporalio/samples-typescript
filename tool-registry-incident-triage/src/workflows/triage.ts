/**
 * incidentTriageWorkflow — single-activity workflow that delegates to the
 * agent. Workflow ID is set deterministically by the webhook receiver
 * (`triage-${alertname}-${service}`), so re-fires from AlertManager re-attach
 * to the running workflow rather than spawning a new one.
 *
 * The `alert-update` signal lets the webhook hand fresh alert state to the
 * running activity if AlertManager re-fires (e.g., updated annotations) — the
 * agent can read the latest state via a query.
 */
import {
  proxyActivities,
  setHandler,
  defineSignal,
  defineQuery,
} from "@temporalio/workflow";

import type * as TriageActivities from "../activities/triage";
import type { AlertPayload, TriageResult } from "../types";

export { approvalWorkflow } from "./approval"; // re-export so the worker bundle picks it up

export const alertUpdateSignal = defineSignal<[AlertPayload]>("alert-update");
export const currentAlertQuery = defineQuery<AlertPayload | null>("current-alert");
export const triageResultQuery = defineQuery<TriageResult | null>("triage-result");

const { triageIncidentActivity } = proxyActivities<typeof TriageActivities>({
  startToCloseTimeout: "8h",     // matches lexicon-temporal's `agenticHitl` profile
  heartbeatTimeout: "120s",
  retry: { maximumAttempts: 1 }, // AgenticSession heartbeat is the resume mechanism
});

export async function incidentTriageWorkflow(initialAlert: AlertPayload): Promise<TriageResult> {
  let currentAlert: AlertPayload = initialAlert;
  let result: TriageResult | null = null;

  setHandler(currentAlertQuery, () => currentAlert);
  setHandler(triageResultQuery, () => result);
  setHandler(alertUpdateSignal, (alert) => { currentAlert = alert; });

  result = await triageIncidentActivity(currentAlert);
  return result;
}
