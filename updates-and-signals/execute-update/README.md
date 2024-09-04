### Update Sample

This workflow represents a counter that can be mutated via an update called
`fetchAndAdd`. The update adds its argument to the counter and returns the
previous value of the counter. The update validator is used to reject negative
arguments (rejected updates are not included in workflow history).

### Running this sample

1. `temporal server start-dev --dynamic-config-value frontend.enableUpdateWorkflowExecution=true` to start [Temporal Server](https://github.com/temporalio/cli/#installation) with Workflow Updates enabled.
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.
