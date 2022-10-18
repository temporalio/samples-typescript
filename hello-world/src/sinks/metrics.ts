import { InjectedSinks } from '@temporalio/worker';
import { Sinks, WorkflowInfo } from '@temporalio/workflow';

export interface MetricsSinks extends Sinks {
  metrics: {
    distribution(name: string, value: number, tags?: Tags): void;
    event(title: string, text?: string, tags?: Tags): void;
    gauge(name: string, value: number, tags?: Tags): void;
    increment(name: string, value: number, tags?: Tags): void;
  };
}

/**
 * MetricsConfig & MetricsClient are objects that come from an internal package.
 * Under the hood, these metrics are sent to the DD Agent that runs in a sidecar.
 */
export function getMetricsSink(metricsConfig: MetricsConfig): InjectedSinks<MetricsSinks> {
  const metrics = new MetricsClient(metricsConfig);
  const getWorkflowInfoTags = (workflowInfo: WorkflowInfo, tags?: Tags) => ({
    taskQueue: workflowInfo.taskQueue,
    workflowId: workflowInfo.workflowId,
    workflowType: workflowInfo.workflowType,
    ...tags,
  });

  return {
    metrics: {
      distribution: {
        fn(workflowInfo, name, value, tags) {
          metrics.distribution(name, value, getWorkflowInfoTags(workflowInfo, tags));
        },
      },
      event: {
        fn(workflowInfo, title, text, tags) {
          metrics.event(title, text, getWorkflowInfoTags(workflowInfo, tags));
        },
      },
      gauge: {
        fn(workflowInfo, name, value, tags) {
          metrics.gauge(name, value, getWorkflowInfoTags(workflowInfo, tags));
        },
      },
      increment: {
        fn(workflowInfo, name, value, tags) {
          metrics.increment(name, value, getWorkflowInfoTags(workflowInfo, tags));
        },
      },
    },
  };
}