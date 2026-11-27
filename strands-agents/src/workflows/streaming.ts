// @@@SNIPSTART typescript-strands-streaming-workflow
import { TemporalAgent } from '@temporalio/strands-agents';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';

type StreamingWorkflowInput = { prompt: string };
type StreamingWorkflowResult = { text: string };

export async function streamingWorkflow({ prompt }: StreamingWorkflowInput): Promise<StreamingWorkflowResult> {
  // Constructing the stream installs the publish/poll handlers that
  // WorkflowStreamClient calls. Nothing in the workflow body reads from it.
  void new WorkflowStream();

  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    streamingTopic: 'events',
  });
  const result = await agent.invoke(prompt);
  return { text: result.toString() };
}
// @@@SNIPEND
