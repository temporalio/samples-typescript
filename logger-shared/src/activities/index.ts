import logger from '../sharedLogger';

export async function greet(name: string): Promise<string> {
  logger.info('Log from activity', { name });
  return `Hello, ${name}!`;
}
