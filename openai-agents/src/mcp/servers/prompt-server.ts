import * as http from 'http';
import * as crypto from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export const SUMMARIZE_PROMPT_TEXT = "You are a concise summarizer. Summarize the user's text in one sentence.";

export async function startPromptHttpServer(port?: number): Promise<{ url: string; close(): Promise<void> }> {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  function createSession(): { server: Server; transport: StreamableHTTPServerTransport } {
    const server = new Server({ name: 'prompt-server', version: '1.0.0' }, { capabilities: { prompts: {} } });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) transports.delete(sid);
    };

    server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'summarize',
          description: 'A prompt for concise text summarization.',
        },
      ],
    }));

    server.setRequestHandler(GetPromptRequestSchema, async (req) => {
      if (req.params.name !== 'summarize') {
        throw new Error(`Unknown prompt: ${req.params.name}`);
      }
      return {
        messages: [
          {
            role: 'user' as const,
            content: { type: 'text' as const, text: SUMMARIZE_PROMPT_TEXT },
          },
        ],
      };
    });

    return { server, transport };
  }

  const httpServer = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf-8')) : undefined;

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, body);
      return;
    }

    const isInit = body && typeof body === 'object' && !Array.isArray(body) && body.method === 'initialize';

    if (isInit || !sessionId) {
      const { server, transport } = createSession();
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
      const sid = transport.sessionId;
      if (sid) transports.set(sid, transport);
      return;
    }

    res.writeHead(404).end('Session not found');
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(port ?? 0, '127.0.0.1', resolve);
  });

  const addr = httpServer.address() as { port: number };
  const url = `http://127.0.0.1:${addr.port}/`;

  return {
    url,
    close: async () => {
      await Promise.allSettled(Array.from(transports.values()).map((t) => t.close()));
      await new Promise<void>((resolve, reject) => httpServer.close((err) => (err ? reject(err) : resolve())));
    },
  };
}

if (require.main === module) {
  startPromptHttpServer(3003)
    .then(({ url }) => {
      console.log(`Prompt HTTP MCP server listening at ${url}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
