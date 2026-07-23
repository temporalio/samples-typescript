import * as path from 'path';
import type { McpToolsetFactory } from '@temporalio/google-adk-agents';

export function filesystemToolset(): McpToolsetFactory {
  const exposedDir = path.resolve(__dirname, 'sample-files');
  return () => ({
    type: 'StdioConnectionParams',
    serverParams: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', exposedDir],
    },
  });
}
