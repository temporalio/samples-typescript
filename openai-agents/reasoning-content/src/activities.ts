import OpenAI from 'openai';

export interface ReasoningResponse {
  reasoningContent: string | null;
  content: string | null;
}

export interface ReasoningClient {
  chat: {
    completions: {
      create(body: { model: string; messages: { role: 'system' | 'user'; content: string }[] }): Promise<{
        choices: { message: { content: string | null; reasoning_content?: string | null } }[];
      }>;
    };
  };
}

let clientFactory: () => ReasoningClient = () => new OpenAI() as unknown as ReasoningClient;

export function setReasoningClientFactory(factory: () => ReasoningClient): void {
  clientFactory = factory;
}

export async function getReasoningResponse(prompt: string, model: string): Promise<ReasoningResponse> {
  const client = clientFactory();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant that explains your reasoning step by step.' },
      { role: 'user', content: prompt },
    ],
  });

  const message = completion.choices[0]?.message;
  return {
    reasoningContent: message?.reasoning_content ?? null,
    content: message?.content ?? null,
  };
}
