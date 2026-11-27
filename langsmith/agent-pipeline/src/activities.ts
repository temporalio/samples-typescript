import { traceable } from 'langsmith/traceable';

const runGatherModel = traceable(async (topic: string): Promise<string> => `facts about ${topic}`, {
  name: 'gather_llm_call',
});

const runWriteModel = traceable(async (facts: string): Promise<string> => `report based on: ${facts}`, {
  name: 'write_llm_call',
});

const runReviewModel = traceable(async (report: string): Promise<string> => `reviewed: ${report}`, {
  name: 'review_llm_call',
});

type GatherFactsInput = { topic: string };
type WriteReportInput = { facts: string };
type ReviewReportInput = { report: string };
type GatherFactsResult = { facts: string };
type WriteReportResult = { report: string };
export type ReviewReportResult = { reviewedReport: string };

export async function gatherFacts({ topic }: GatherFactsInput): Promise<GatherFactsResult> {
  return { facts: await runGatherModel(topic) };
}

export async function writeReport({ facts }: WriteReportInput): Promise<WriteReportResult> {
  return { report: await runWriteModel(facts) };
}

export async function reviewReport({ report }: ReviewReportInput): Promise<ReviewReportResult> {
  return { reviewedReport: await runReviewModel(report) };
}
