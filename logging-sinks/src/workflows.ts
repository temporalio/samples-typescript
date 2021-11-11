// @@@SNIPSTART typescript-logger-sink-interface
import * as wf from '@temporalio/workflow';

export interface LoggerSinks extends wf.Sinks {
  logger: {
    info(message: string): void;
  };
}
// @@@SNIPEND
// @@@SNIPSTART typescript-logger-sink-workflow

const { logger } = wf.proxySinks<LoggerSinks>();

export async function logSampleWorkflow(): Promise<void> {
  logger.info('Workflow execution started');
}
// @@@SNIPEND