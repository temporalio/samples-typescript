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

type SinkWorkflowResult = { greeting: string };

export async function sinkWorkflow(): Promise<SinkWorkflowResult> {
  log.info('Workflow Execution started');
  alerter.alert('alerter: Workflow Execution started');
  return { greeting: 'Hello, Temporal!' };
}
// @@@SNIPEND
