import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({ name: 'echo-server', version: '0.1.0' });

server.registerTool(
  'echo',
  {
    description: 'Return the input message unchanged.',
    inputSchema: { message: z.string() },
  },
  async ({ message }) => ({ content: [{ type: 'text', text: message }] })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
