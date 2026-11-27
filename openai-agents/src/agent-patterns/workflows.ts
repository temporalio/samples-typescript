import { Agent } from '@openai/agents-core';
import { InputGuardrailTripwireTriggered, OutputGuardrailTripwireTriggered } from '@openai/agents-core';
import { ApplicationFailure } from '@temporalio/workflow';
import type {
  InputGuardrail,
  InputGuardrailFunctionArgs,
  GuardrailFunctionOutput,
  OutputGuardrail,
  OutputGuardrailFunctionArgs,
} from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';

type DeterministicInput = { prompt: string };
type DeterministicResult = { text: string };

export async function deterministic({ prompt }: DeterministicInput): Promise<DeterministicResult> {
  const outlineAgent = new Agent({
    name: 'OutlineAgent',
    instructions: 'Create a brief outline for the given topic.',
  });
  const draftAgent = new Agent({
    name: 'DraftAgent',
    instructions: 'Write a short draft based on the outline provided.',
  });
  const polishAgent = new Agent({
    name: 'PolishAgent',
    instructions: 'Polish and improve the draft provided.',
  });

  const runner = new TemporalOpenAIRunner();

  const outlineResult = await runner.run(outlineAgent, prompt);
  const outline = outlineResult.finalOutput ?? '';

  const draftResult = await runner.run(draftAgent, outline);
  const draft = draftResult.finalOutput ?? '';

  const polishResult = await runner.run(polishAgent, draft);
  return { text: polishResult.finalOutput ?? '' };
}

type ParallelizationInput = { prompt: string };
type ParallelizationResult = { text: string };

export async function parallelization({ prompt }: ParallelizationInput): Promise<ParallelizationResult> {
  const agent1 = new Agent({
    name: 'Perspective1Agent',
    instructions: 'Answer the question from a technical perspective.',
  });
  const agent2 = new Agent({
    name: 'Perspective2Agent',
    instructions: 'Answer the question from a business perspective.',
  });
  const agent3 = new Agent({
    name: 'Perspective3Agent',
    instructions: 'Answer the question from a creative perspective.',
  });
  const judgeAgent = new Agent({
    name: 'JudgeAgent',
    instructions: 'You are given multiple candidate answers. Select the best one and return it verbatim.',
  });

  const runner = new TemporalOpenAIRunner();

  const [r1, r2, r3] = await Promise.all([
    runner.run(agent1, prompt),
    runner.run(agent2, prompt),
    runner.run(agent3, prompt),
  ]);

  const candidates = [r1.finalOutput ?? '', r2.finalOutput ?? '', r3.finalOutput ?? ''];
  const judgeInput = candidates.map((c, i) => `Candidate ${i + 1}:\n${c}`).join('\n\n');

  const judgeResult = await runner.run(judgeAgent, judgeInput);
  return { text: judgeResult.finalOutput ?? '' };
}

type LlmAsJudgeInput = { prompt: string };
type LlmAsJudgeResult = { text: string };

export async function llmAsJudge({ prompt }: LlmAsJudgeInput): Promise<LlmAsJudgeResult> {
  const generatorAgent = new Agent({
    name: 'GeneratorAgent',
    instructions: 'Generate a response to the given prompt.',
  });
  const judgeAgent = new Agent({
    name: 'JudgeAgent',
    instructions:
      'Evaluate the response. Reply with exactly "APPROVED" if it is good, or "REJECTED: <reason>" if it needs improvement.',
  });

  const runner = new TemporalOpenAIRunner();
  const maxIterations = 3;
  let output = '';

  for (let i = 0; i < maxIterations; i++) {
    const genResult = await runner.run(generatorAgent, i === 0 ? prompt : `Improve: ${output}`);
    output = genResult.finalOutput ?? '';

    const judgeResult = await runner.run(judgeAgent, output);
    const judgment = judgeResult.finalOutput ?? '';

    if (judgment.startsWith('APPROVED')) {
      return { text: output };
    }
  }

  return { text: output };
}

// @@@SNIPSTART typescript-openai-agents-agent-as-tool-workflow
type AgentsAsToolsInput = { prompt: string };
type AgentsAsToolsResult = { text: string };

export async function agentsAsTools({ prompt }: AgentsAsToolsInput): Promise<AgentsAsToolsResult> {
  const specialistAgent = new Agent({
    name: 'SpecialistAgent',
    instructions: 'You are a specialist. Answer questions concisely.',
  });

  const specialistTool = specialistAgent.asTool({
    toolName: 'ask_specialist',
    toolDescription: 'Ask the specialist agent a question and get a concise answer.',
  });

  const orchestratorAgent = new Agent({
    name: 'OrchestratorAgent',
    instructions:
      'You orchestrate tasks. Use the ask_specialist tool to get answers, then synthesize a final response.',
    tools: [specialistTool],
  });

  const runner = new TemporalOpenAIRunner();
  const result = await runner.run(orchestratorAgent, prompt);
  return { text: result.finalOutput ?? '' };
}
// @@@SNIPEND

type InputGuardrailInput = { prompt: string };
type InputGuardrailResult = { text: string };

export async function inputGuardrail({ prompt }: InputGuardrailInput): Promise<InputGuardrailResult> {
  const blockedKeywords = ['blocked', 'BLOCK', 'forbidden'];

  const guardrail: InputGuardrail = {
    name: 'keyword-guardrail',
    execute: async (args: InputGuardrailFunctionArgs): Promise<GuardrailFunctionOutput> => {
      const inputText = typeof args.input === 'string' ? args.input : JSON.stringify(args.input);
      const tripped = blockedKeywords.some((kw) => inputText.includes(kw));
      return { tripwireTriggered: tripped, outputInfo: { checked: inputText } };
    },
  };

  const agent = new Agent({
    name: 'GuardedAgent',
    instructions: 'You are a helpful assistant.',
  });

  const runner = new TemporalOpenAIRunner();
  try {
    const result = await runner.run(agent, prompt, {
      runConfig: { inputGuardrails: [guardrail] },
    });
    return { text: result.finalOutput ?? '' };
  } catch (err) {
    const tripwire =
      err instanceof InputGuardrailTripwireTriggered
        ? err
        : err instanceof ApplicationFailure && err.cause instanceof InputGuardrailTripwireTriggered
          ? err.cause
          : undefined;
    if (tripwire) {
      return { text: `BLOCKED: input failed guardrail "${tripwire.result.guardrail.name}"` };
    }
    throw err;
  }
}

type OutputGuardrailInput = { prompt: string };
type OutputGuardrailResult = { text: string };

export async function outputGuardrail({ prompt }: OutputGuardrailInput): Promise<OutputGuardrailResult> {
  const bannedPhrase = 'UNSAFE';

  const guardrail: OutputGuardrail = {
    name: 'output-safety-guardrail',
    execute: async (args: OutputGuardrailFunctionArgs): Promise<GuardrailFunctionOutput> => {
      const outputText = typeof args.agentOutput === 'string' ? args.agentOutput : JSON.stringify(args.agentOutput);
      const tripped = outputText.includes(bannedPhrase);
      return { tripwireTriggered: tripped, outputInfo: { checked: outputText } };
    },
  };

  const agent = new Agent({
    name: 'GuardedOutputAgent',
    instructions: 'You are a helpful assistant.',
  });

  const runner = new TemporalOpenAIRunner();
  try {
    const result = await runner.run(agent, prompt, {
      runConfig: { outputGuardrails: [guardrail] },
    });
    return { text: result.finalOutput ?? '' };
  } catch (err) {
    const tripwire =
      err instanceof OutputGuardrailTripwireTriggered
        ? err
        : err instanceof ApplicationFailure && err.cause instanceof OutputGuardrailTripwireTriggered
          ? err.cause
          : undefined;
    if (tripwire) {
      return { text: `BLOCKED: output failed guardrail "${tripwire.result.guardrail.name}"` };
    }
    throw err;
  }
}
