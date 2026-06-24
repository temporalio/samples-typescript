import OpenAI from 'openai';

export interface ReasoningResponse {
  reasoningContent: string | null;
  content: string | null;
}

interface ReasoningOutputItem {
  type: 'reasoning';
  summary: { text: string }[];
}

type MessageContentPart = { type: 'output_text'; text: string } | { type: 'refusal'; refusal: string };

interface MessageOutputItem {
  type: 'message';
  content: MessageContentPart[];
}

type ResponseOutputItem = ReasoningOutputItem | MessageOutputItem | { type: string };

export interface ReasoningClient {
  responses: {
    create(body: {
      model: string;
      instructions: string;
      input: string;
      reasoning: { summary: 'auto' | 'concise' | 'detailed' };
    }): Promise<{ output: ResponseOutputItem[]; output_text?: string }>;
  };
}

let clientFactory: () => ReasoningClient = () => new OpenAI() as unknown as ReasoningClient;

export function setReasoningClientFactory(factory: () => ReasoningClient): void {
  clientFactory = factory;
}

export async function getReasoningResponse(prompt: string, model: string): Promise<ReasoningResponse> {
  const client = clientFactory();
  const response = await client.responses.create({
    model,
    instructions: 'You are a helpful assistant that explains your reasoning step by step.',
    input: prompt,
    reasoning: { summary: 'auto' },
  });

  const reasoningSummaries: string[] = [];
  let content: string | null = null;
  for (const item of response.output) {
    if (item.type === 'reasoning') {
      for (const part of (item as ReasoningOutputItem).summary) {
        reasoningSummaries.push(part.text);
      }
    } else if (item.type === 'message') {
      for (const part of (item as MessageOutputItem).content) {
        if (part.type === 'output_text' && typeof part.text === 'string') {
          content = (content ?? '') + part.text;
        }
      }
    }
  }

  return {
    reasoningContent: reasoningSummaries.length > 0 ? reasoningSummaries.join('\n\n') : null,
    content: content ?? response.output_text ?? null,
  };
}
