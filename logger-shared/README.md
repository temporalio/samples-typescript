# Shared logger demo

This project demonstrates how to add a [winston](https://github.com/winstonjs/winston) logger that is shared between Workflows and Activities.

You should not use winston directly in Workflow code.
The only potential exception is if you are only using winston's [Console transport](https://github.com/winstonjs/winston/blob/master/docs/transports.md#console-transport).
That is because Workflow code runs in a sandbox, so transports that [write to the file system](https://github.com/winstonjs/winston/blob/master/docs/transports.md#file-transport) or [make HTTP requests](https://github.com/winstonjs/winston/blob/master/docs/transports.md#http-transport) will not work.

The [Logging docs](https://docs.temporal.io/application-development/observability/#logging) and [Core docs](https://docs.temporal.io/clusters/#monitoring-and-observation) explain some of the code in this sample.

This sample is similar to the [instrumentation sample](../instrumentation/README.md).
The key difference is the instrumentation sample doesn't use the logger directly from Workflow logic.
This sample shows that you can import the same `sharedLogger.ts` file from both Workflows and Activities, and use the same logging interface.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

<details>
<summary>
Sample worker output
</summary>

```
2023-01-20T16:55:47.707Z [INFO] Workflow bundle created { size: '0.69MB' }
2023-01-20T16:55:47.949402Z  INFO temporal_sdk_core::worker: Initializing worker task_queue=logger-shared namespace=default
2023-01-20T16:55:47.950Z [INFO] Worker state changed { state: 'RUNNING' }
2023-01-20T16:55:53.088Z [undefined] debug: Workflow started {
  namespace: 'default',
  taskQueue: 'logger-shared',
  workflowId: 'instrumentation-sample-0',
  runId: '5904dfe1-095e-42bd-b153-796816d3c32a',
  workflowType: 'logSampleWorkflow'
}
2023-01-20T16:55:53.109Z [undefined] info: Log from Activity { name: 'Temporal' }
2023-01-20T16:55:53.127Z [undefined] info: Log from Workflow { greeting: 'Hello, Temporal!' }
2023-01-20T16:55:53.127Z [undefined] debug: Workflow completed {
  namespace: 'default',
  taskQueue: 'logger-shared',
  workflowId: 'instrumentation-sample-0',
  runId: '5904dfe1-095e-42bd-b153-796816d3c32a',
  workflowType: 'logSampleWorkflow'
}
```

</details>
