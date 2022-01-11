# OpenTelemetry Interceptors

This sample features '@temporalio/interceptors-opentelemetry`, which uses [Interceptors](https://docs.temporal.io/docs/typescript/interceptors) to add tracing of Workflows and Activities with [opentelemetry](https://opentelemetry.io/).

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

Example output:

```
Hello, Temporal!
{
  traceId: '74bf8e700df7dd3d8e140feebe70927b',
  parentId: undefined,
  name: 'StartWorkflow:example',
  id: 'ab6e93cce7ed7a15',
  kind: 0,
  timestamp: 1641749671800859,
  duration: 515453,
  attributes: { run_id: '00cf070e-b691-4943-a8e9-9696c1baef4a' },
  status: { code: 1 },
  events: []
}

```
