// @@@SNIPSTART typescript-logger-sink-interface
import { log, proxySinks, Sinks } from '@temporalio/workflow';

export interface AlertSinks extends Sinks {
  alerter: {
    alert(message: string): void;
  };
}

export type MySinks = AlertSinks;
// @@@SNIPEND

// @@@SNIPSTART typescript-logger-sink-workflow
const { alerter } = proxySinks<MySinks>();

export async function sinkWorkflow(): Promise<string> {
  log.info('Workflow Execution started');
  alerter.alert('alerter: Workflow Execution started');
  return 'Hello, Temporal!';
}
// @@@SNIPEND
