// @@@SNIPSTART typescript-langsmith-activity
import { traceable } from 'langsmith/traceable';

const callModel = traceable(
  async (prompt: string): Promise<string> => {
    return `answer to: ${prompt}`;
  },
  { name: 'inner_llm_call' },
);

type AnswerInput = { prompt: string };

export type AnswerResult = { answer: string };

export async function answer({ prompt }: AnswerInput): Promise<AnswerResult> {
  return { answer: await callModel(prompt) };
}
// @@@SNIPEND
