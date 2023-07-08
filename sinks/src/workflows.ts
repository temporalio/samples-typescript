// @@@SNIPSTART typescript-logger-sink-interface
import { proxySinks, LoggerSinks, Sinks } from '@temporalio/workflow';

export interface AlertSinks extends Sinks {
  alerter: {
    alert(message: string): void;
  };
}

export type MySinks = AlertSinks & LoggerSinks;
// @@@SNIPEND

// @@@SNIPSTART typescript-logger-sink-workflow
const { alerter, defaultWorkerLogger } = proxySinks<MySinks>();

export async function sinkWorkflow(): Promise<string> {
  defaultWorkerLogger.info('default logger: Workflow Execution started');
  alerter.alert('alerter: Workflow Execution started');
  return 'Hello, Temporal!';
}
// @@@SNIPEND
