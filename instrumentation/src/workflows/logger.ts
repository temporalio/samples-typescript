// @@@SNIPSTART typescript-workflow-logger
import * as wf from '@temporalio/workflow';

export interface LoggerSinks extends wf.Sinks {
  logger: {
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
  };
}

export const { logger } = wf.proxySinks<LoggerSinks>();
// @@@SNIPEND
