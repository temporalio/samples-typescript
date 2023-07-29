import { Context } from '@temporalio/activity';

// @@@SNIPSTART typescript-hello-activity
export async function greet(name: string): Promise<string> {
  return Context.current().info.heartbeatTimeoutMs?.toString() || 'undefined';
}
// @@@SNIPEND
