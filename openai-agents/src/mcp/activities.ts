import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export function makeActivities(promptServerUrl: string) {
  return {
    async fetchSummarizePrompt(): Promise<string> {
      const client = new Client({ name: 'prompt-activity-client', version: '1.0.0' });
      const transport = new StreamableHTTPClientTransport(new URL(promptServerUrl));
      await client.connect(transport);
      try {
        const result = await client.getPrompt({ name: 'summarize' });
        const textContent = result.messages.find((m) => m.content.type === 'text');
        if (!textContent || textContent.content.type !== 'text') {
          throw new Error('summarize prompt returned no text content');
        }
        return textContent.content.text;
      } finally {
        await client.close();
      }
    },
  };
}

export type Activities = ReturnType<typeof makeActivities>;
