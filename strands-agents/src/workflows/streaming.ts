// @@@SNIPSTART typescript-strands-streaming-workflow
import { TemporalAgent } from '@temporalio/strands-agents';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';

export async function streamingWorkflow(prompt: string): Promise<string> {
  // Constructing the stream installs the publish/poll handlers that
  // WorkflowStreamClient calls. Nothing in the workflow body reads from it.
  void new WorkflowStream();

  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    streamingTopic: 'events',
  });
  const result = await agent.invoke(prompt);
  return result.toString();
}
// @@@SNIPEND
