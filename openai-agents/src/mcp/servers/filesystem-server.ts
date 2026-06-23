import * as fs from 'fs';
import * as path from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const SAMPLE_FILES_DIR = path.resolve(__dirname, 'sample-files');

function createFilesystemServer(): Server {
  const server = new Server({ name: 'filesystem', version: '1.0.0' }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'listFiles',
        description: 'List all files in the sample-files directory.',
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: [],
          additionalProperties: false,
        },
      },
      {
        name: 'readFile',
        description: 'Read the contents of a file in the sample-files directory.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            filename: { type: 'string', description: 'The filename to read (basename only).' },
          },
          required: ['filename'],
          additionalProperties: false,
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    if (name === 'listFiles') {
      const files = fs
        .readdirSync(SAMPLE_FILES_DIR)
        .filter((f) => fs.statSync(path.join(SAMPLE_FILES_DIR, f)).isFile());
      return { content: [{ type: 'text', text: files.join('\n') }] };
    }
    if (name === 'readFile') {
      const filename = String((args as Record<string, unknown>)?.filename ?? '');
      const resolved = path.resolve(SAMPLE_FILES_DIR, filename);
      if (!resolved.startsWith(SAMPLE_FILES_DIR + path.sep) && resolved !== SAMPLE_FILES_DIR) {
        return { content: [{ type: 'text', text: 'Error: path escape not allowed.' }], isError: true };
      }
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        return { content: [{ type: 'text', text: `Error: file not found: ${filename}` }], isError: true };
      }
      const text = fs.readFileSync(resolved, 'utf-8');
      return { content: [{ type: 'text', text }] };
    }
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  });

  return server;
}

if (require.main === module) {
  const server = createFilesystemServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    process.stderr.write(String(err) + '\n');
    process.exit(1);
  });
}

export { createFilesystemServer };
