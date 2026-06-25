import * as http from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const SSE_PATH = '/sse';
const MESSAGES_PATH = '/messages';

function buildToolHandlers(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'add',
        description: 'Add two numbers together.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            a: { type: 'number', description: 'First number.' },
            b: { type: 'number', description: 'Second number.' },
          },
          required: ['a', 'b'],
          additionalProperties: false,
        },
      },
      {
        name: 'getWeather',
        description: 'Get canned weather data for a city.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            city: { type: 'string', description: 'City name.' },
          },
          required: ['city'],
          additionalProperties: false,
        },
      },
      {
        name: 'getSecret',
        description: 'Get the secret passphrase.',
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: [],
          additionalProperties: false,
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const a = (args ?? {}) as Record<string, unknown>;
    if (name === 'add') {
      return { content: [{ type: 'text', text: String(Number(a.a) + Number(a.b)) }] };
    }
    if (name === 'getWeather') {
      const city = String(a.city ?? 'unknown');
      return { content: [{ type: 'text', text: JSON.stringify({ city, temperature: '22C', conditions: 'Sunny' }) }] };
    }
    if (name === 'getSecret') {
      return { content: [{ type: 'text', text: 'swordfish' }] };
    }
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  });
}

export async function startToolsSseServer(port?: number): Promise<{ url: string; close(): Promise<void> }> {
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === SSE_PATH) {
      const mcpServer = new Server({ name: 'tools-sse', version: '1.0.0' }, { capabilities: { tools: {} } });
      buildToolHandlers(mcpServer);
      const transport = new SSEServerTransport(MESSAGES_PATH, res);
      transports.set(transport.sessionId, transport);
      transport.onclose = () => transports.delete(transport.sessionId);
      await mcpServer.connect(transport);
      return;
    }

    if (req.method === 'POST' && req.url?.startsWith(MESSAGES_PATH)) {
      const sessionId = new URL(req.url, 'http://localhost').searchParams.get('sessionId');
      const transport = sessionId ? transports.get(sessionId) : undefined;
      if (!transport) {
        res.writeHead(404).end('Session not found');
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf-8')) : undefined;
      await transport.handlePostMessage(req, res, body);
      return;
    }

    res.writeHead(404).end();
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(port ?? 0, '127.0.0.1', resolve);
  });

  const addr = httpServer.address() as { port: number };
  const url = `http://127.0.0.1:${addr.port}${SSE_PATH}`;

  return {
    url,
    close: async () => {
      await Promise.allSettled(Array.from(transports.values()).map((t) => t.close()));
      await new Promise<void>((resolve, reject) => httpServer.close((err) => (err ? reject(err) : resolve())));
    },
  };
}

if (require.main === module) {
  startToolsSseServer(3002)
    .then(({ url }) => {
      console.log(`Tools SSE MCP server listening at ${url}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
