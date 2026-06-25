import type { StatefulTemporalMCPServer } from '@temporalio/openai-agents/workflow';

export function createNotesServer(): StatefulTemporalMCPServer {
  const notes = new Map<string, string>();

  return {
    cacheToolsList: false,
    name: 'memory',
    async connect() {},
    async close() {},
    async invalidateToolsCache() {},
    async cleanup() {},
    async listTools() {
      return [
        {
          name: 'saveNote',
          description: 'Save a note with a title and body.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['title', 'body'],
            additionalProperties: false,
          },
        },
        {
          name: 'listNotes',
          description: 'List all note titles saved in this session.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false,
          },
        },
        {
          name: 'readNote',
          description: 'Read the body of a saved note by title.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
            },
            required: ['title'],
            additionalProperties: false,
          },
        },
      ];
    },
    async callTool(toolName: string, args: Record<string, unknown> | null) {
      const a = args ?? {};
      if (toolName === 'saveNote') {
        const title = String(a.title);
        const body = String(a.body);
        notes.set(title, body);
        return [{ type: 'text', text: `Saved note "${title}".` }];
      }
      if (toolName === 'listNotes') {
        const titles = Array.from(notes.keys());
        return [{ type: 'text', text: titles.length ? titles.join(', ') : '(no notes yet)' }];
      }
      if (toolName === 'readNote') {
        const title = String(a.title);
        const body = notes.get(title);
        return [{ type: 'text', text: body ?? `(no note titled "${title}")` }];
      }
      return [{ type: 'text', text: `Unknown tool: ${toolName}` }];
    },
  };
}
