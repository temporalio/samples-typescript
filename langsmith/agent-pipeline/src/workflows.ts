import { executeChild, proxyActivities, workflowInfo } from '@temporalio/workflow';
import type * as activities from './activities';

const { gatherFacts, writeReport, reviewReport } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function ReviewWorkflow(report: string): Promise<string> {
  return reviewReport(report);
}

export async function ResearchWorkflow(topic: string): Promise<string> {
  const facts = await gatherFacts(topic);
  const report = await writeReport(facts);
  return executeChild(ReviewWorkflow, {
    args: [report],
    workflowId: `${workflowInfo().workflowId}-review`,
  });
}
