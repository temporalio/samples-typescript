// @@@SNIPSTART typescript-strands-hello-world-workflow
import { TemporalAgent } from '@temporalio/strands-agents';

type HelloWorldInput = { prompt: string };
type HelloWorldResult = { text: string };

export async function helloWorld({ prompt }: HelloWorldInput): Promise<HelloWorldResult> {
  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
  });
  const result = await agent.invoke(prompt);
  return { text: result.toString() };
}
// @@@SNIPEND
