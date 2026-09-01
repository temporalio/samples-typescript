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

export async function gatherFacts(topic: string): Promise<string> {
  return runGatherModel(topic);
}

export async function writeReport(facts: string): Promise<string> {
  return runWriteModel(facts);
}

export async function reviewReport(report: string): Promise<string> {
  return runReviewModel(report);
}
