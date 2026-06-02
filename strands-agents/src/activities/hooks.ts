// @@@SNIPSTART typescript-strands-hooks-activity
import { log } from '@temporalio/activity';

export async function persistToolCall(toolName: string): Promise<void> {
  // In production, write to a database / S3 / your audit pipeline.
  log.info(`audit: tool ${toolName} completed`);
}
// @@@SNIPEND
