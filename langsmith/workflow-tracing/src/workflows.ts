// @@@SNIPSTART typescript-langsmith-workflow
import { traceable } from 'langsmith/traceable';

const extractKeyPoints = traceable(async (text: string): Promise<string> => `points:${text}`, {
  name: 'extract_key_points',
});

const summarize = traceable(async (points: string): Promise<string> => `summary:${points}`, {
  name: 'summarize',
});

export async function SummarizeWorkflow(text: string): Promise<string> {
  const points = await extractKeyPoints(text);
  return summarize(points);
}
// @@@SNIPEND
