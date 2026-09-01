import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { Type } from '@google/genai';
import { TemporalModel } from '@temporalio/google-adk-agents/workflow';
import { ApplicationFailure } from '@temporalio/workflow';

export interface IncidentSummary {
  title: string;
  severity: 'low' | 'medium' | 'high';
  actions: string[];
}

export async function summarizeIncident(description: string): Promise<IncidentSummary> {
  const agent = new LlmAgent({
    name: 'incident_summarizer',
    model: new TemporalModel('gemini-2.5-flash'),
    instruction: 'Summarize the incident using the requested schema.',
    outputSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
        actions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['title', 'severity', 'actions'],
    },
  });
  const runner = new InMemoryRunner({ agent });
  let text = '';
  for await (const event of runner.runEphemeral({
    userId: 'user',
    newMessage: { role: 'user', parts: [{ text: description }] },
  })) {
    if (isFinalResponse(event)) text = stringifyContent(event);
  }
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw ApplicationFailure.nonRetryable('Model returned malformed JSON', 'InvalidIncidentSummary');
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw ApplicationFailure.nonRetryable('Model returned an invalid incident summary', 'InvalidIncidentSummary');
  }
  const result = value as Record<string, unknown>;
  if (
    typeof result.title !== 'string' ||
    typeof result.severity !== 'string' ||
    !['low', 'medium', 'high'].includes(result.severity) ||
    !Array.isArray(result.actions) ||
    !result.actions.every((action) => typeof action === 'string')
  ) {
    throw ApplicationFailure.nonRetryable('Model returned an invalid incident summary', 'InvalidIncidentSummary');
  }
  return {
    title: result.title,
    severity: result.severity,
    actions: result.actions,
  } as IncidentSummary;
}
