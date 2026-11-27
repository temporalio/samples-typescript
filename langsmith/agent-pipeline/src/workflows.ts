// @@@SNIPSTART typescript-langsmith-agent-pipeline
import { executeChild, proxyActivities, workflowInfo } from '@temporalio/workflow';
import type * as activities from './activities';

const { gatherFacts, writeReport, reviewReport } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

type ReviewWorkflowInput = { report: string };
type ResearchWorkflowInput = { topic: string };

export async function ReviewWorkflow(input: ReviewWorkflowInput): Promise<activities.ReviewReportResult> {
  return reviewReport(input);
}

export async function ResearchWorkflow(input: ResearchWorkflowInput): Promise<activities.ReviewReportResult> {
  const { facts } = await gatherFacts(input);
  const { report } = await writeReport({ facts });
  return executeChild(ReviewWorkflow, {
    args: [{ report }],
    workflowId: `${workflowInfo().workflowId}-review`,
  });
}
// @@@SNIPEND
