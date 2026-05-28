import { AfterToolCallEvent, tool } from '@strands-agents/sdk';
import { TemporalAgent, workflow as strandsWorkflow } from '@temporalio/strands-agents';
import { z } from 'zod';

const echo = tool({
  name: 'echo',
  description: 'Echo back the input text.',
  inputSchema: z.object({ text: z.string() }),
  callback: ({ text }) => text,
});

export async function hooksWorkflow(prompt: string): Promise<string[]> {
  const fired: string[] = [];

  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    tools: [echo],
  });

  // Callback 1: in-workflow, deterministic state mutation.
  agent.addHook(AfterToolCallEvent, (event) => {
    fired.push(event.toolUse.name);
  });

  // Callback 2: dispatch to a Temporal activity for I/O.
  agent.addHook(
    AfterToolCallEvent,
    strandsWorkflow.activityAsHook('persistToolCall', {
      activityInput: (event) => event.toolUse.name,
      activityOptions: { startToCloseTimeout: '15 seconds', retry: { maximumAttempts: 3 } },
    })
  );

  await agent.invoke(prompt);
  return fired;
}
