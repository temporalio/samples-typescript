// @@@SNIPSTART typescript-openai-agents-sandboxes-workflow
import { Manifest, SandboxAgent } from '@openai/agents-core/sandbox';
import { TemporalOpenAIRunner, temporalSandboxClient, workerEnvValue } from '@temporalio/openai-agents/workflow';
import { ApplicationFailure } from '@temporalio/workflow';

type SandboxWorkflowInput = { prompt: string };
type SandboxWorkflowResult = { text: string };

export async function sandboxWorkflow({ prompt }: SandboxWorkflowInput): Promise<SandboxWorkflowResult> {
  const agent = new SandboxAgent({
    name: 'SandboxAgent',
    instructions:
      'Use the sandbox to do the work rather than answering from memory, then report what the commands returned. ' +
      'Run each command to completion in a single exec_command call instead of leaving a process running to check ' +
      'on later. SERVICE_TOKEN holds a credential: you may use it, but never print its value.',
    defaultManifest: new Manifest({
      environment: { SERVICE_TOKEN: workerEnvValue('SANDBOX_SERVICE_TOKEN') },
    }),
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt, {
    runConfig: { sandbox: { client: temporalSandboxClient('local') } },
  });
  if (typeof result.finalOutput !== 'string') {
    throw ApplicationFailure.nonRetryable('SandboxAgent returned no final output');
  }
  return { text: result.finalOutput };
}
// @@@SNIPEND
