/** Shared types between workflow, activity, and client. */

export interface AlertPayload {
  status: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
  endsAt?: string;
  fingerprint?: string;
}

export interface ProposedRemediation {
  /** kubectl/promtool/etc command, or human-readable action. */
  action: string;
  /** Why the agent thinks this would help. */
  justification: string;
}

export interface TriageResult {
  status: "resolved" | "unresolved";
  summary: string;
  remediations: ProposedRemediation[];
}

export interface ApprovalRequest {
  message: string;
  diagnosis: string;
  proposedAction: string;
}

export interface ApprovalResponse {
  decision: "approved" | "rejected";
  reason: string;
}
