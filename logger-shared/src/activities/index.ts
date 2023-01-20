// @@@SNIPSTART typescript-shared-logger-activity
import logger from '../sharedLogger';

export async function greet(name: string): Promise<string> {
  logger.info('Log from Activity', { name });
  return `Hello, ${name}!`;
}
// @@@SNIPEND
