import { traceable } from 'langsmith/traceable';

const callModel = traceable(
  async (prompt: string): Promise<string> => {
    return `answer to: ${prompt}`;
  },
  { name: 'inner_llm_call' }
);

export async function answer(prompt: string): Promise<string> {
  return callModel(prompt);
}
