import { TemporalAgent } from '@temporalio/strands-agents';
import { z } from 'zod';

export const PersonInfo = z.object({
  name: z.string().describe('Name of the person'),
  age: z.number().describe('Age of the person'),
  occupation: z.string().describe('Occupation of the person'),
});

export type PersonInfo = z.infer<typeof PersonInfo>;

export async function structuredOutputWorkflow(prompt: string): Promise<PersonInfo> {
  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    structuredOutputSchema: PersonInfo,
  });
  const result = await agent.invoke(prompt);
  return result.structuredOutput as PersonInfo;
}
