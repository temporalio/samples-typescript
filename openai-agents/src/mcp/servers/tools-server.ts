import * as http from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

function registerToolHandlers(server: Server): void {
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
      const result = Number(a.a) + Number(a.b);
      return { content: [{ type: 'text', text: String(result) }] };
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

export async function startToolsHttpServer(port?: number): Promise<{ url: string; close(): Promise<void> }> {
  const httpServer = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf-8')) : undefined;

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = new Server({ name: 'tools', version: '1.0.0' }, { capabilities: { tools: {} } });
    registerToolHandlers(server);
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(port ?? 0, '127.0.0.1', resolve);
  });

  const addr = httpServer.address() as { port: number };
  const url = `http://127.0.0.1:${addr.port}/`;

  return {
    url,
    close: async () => {
      await new Promise<void>((resolve, reject) => httpServer.close((err) => (err ? reject(err) : resolve())));
    },
  };
}

if (require.main === module) {
  startToolsHttpServer(3001)
    .then(({ url }) => {
      console.log(`Tools HTTP MCP server listening at ${url}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
