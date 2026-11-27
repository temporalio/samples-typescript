// @@@SNIPSTART typescript-langsmith-workflow
import { traceable } from 'langsmith/traceable';

const extractKeyPoints = traceable(async (text: string): Promise<string> => `points:${text}`, {
  name: 'extract_key_points',
});

const summarize = traceable(async (points: string): Promise<string> => `summary:${points}`, {
  name: 'summarize',
});

type SummarizeWorkflowInput = { text: string };
type SummarizeWorkflowResult = { summary: string };

export async function SummarizeWorkflow({ text }: SummarizeWorkflowInput): Promise<SummarizeWorkflowResult> {
  const points = await extractKeyPoints(text);
  return { summary: await summarize(points) };
}
// @@@SNIPEND
