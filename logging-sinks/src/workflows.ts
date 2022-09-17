// @@@SNIPSTART typescript-logger-sink-interface
import { proxySinks, Sinks } from '@temporalio/workflow';

export interface CustomLoggerSinks extends Sinks {
  logger: {
    info(message: string): void;
  };
}
// @@@SNIPEND

// @@@SNIPSTART typescript-logger-sink-workflow
const { logger } = proxySinks<CustomLoggerSinks>();

export async function logSampleWorkflow(): Promise<string> {
  logger.info('Workflow execution started');
  return 'Hello, Temporal!';
}
// @@@SNIPEND
