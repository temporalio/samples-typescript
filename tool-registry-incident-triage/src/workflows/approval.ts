/**
 * approvalWorkflow — companion HITL workflow.
 *
 * The triage agent's `request_human_approval` tool calls signalWithStart against
 * a deterministic ID per alert group. This workflow stores the latest agent
 * request, exposes it as a query, and returns the operator's decision.
 *
 * Why a separate workflow:
 *  - LLM non-determinism is OK: a re-issued tool call re-attaches to the SAME
 *    approval workflow instead of re-pinging the operator with a fresh request.
 *  - Survives the worker pod dying mid-wait. The operator can take hours to
 *    respond; the triage activity blocks on .result() of THIS workflow.
 *  - Cleanly visible in the Temporal Cloud UI as a separate workflow type so
 *    operators can list pending approvals without reading triage history.
 */
import { defineSignal, defineQuery, setHandler, condition } from "@temporalio/workflow";
import type { ApprovalRequest, ApprovalResponse } from "../types";

export const approvalRequestSignal = defineSignal<[ApprovalRequest]>("approval-request");
export const approvalDecisionSignal = defineSignal<[ApprovalResponse]>("approval-decision");
export const pendingApprovalQuery = defineQuery<ApprovalRequest | null>("pending-approval");

export async function approvalWorkflow(_workflowKey: string): Promise<ApprovalResponse> {
  let request: ApprovalRequest | null = null;
  let response: ApprovalResponse | null = null;

  setHandler(pendingApprovalQuery, () => request);
  setHandler(approvalRequestSignal, (req) => { request = req; });
  setHandler(approvalDecisionSignal, (res) => { response = res; });

  await condition(() => request !== null);
  await condition(() => response !== null);
  return response!;
}
