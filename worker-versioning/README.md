# Build ID Based Versioning

This sample illustrates how to use [Build ID based versioning](https://docs.temporal.io/workers#worker-versioning) to help you appropriately roll out
incompatible and compatible changes to workflow and activity code for the same task queue.

## Description

The sample shows you how to roll out both a compatible change and an incompatible change to a
workflow.

## Running

1. `temporal server start-dev --dynamic-config-value frontend.workerVersioningDataAPIs=true --dynamic-config-value frontend.workerVersioningWorkflowAPIs=true --dynamic-config-value worker.buildIdScavengerEnabled=true`
   to start [Temporal Server](https://github.com/temporalio/cli/#installation) with Worker Versioning enabled.
1. `npm install` to install dependencies.
1. `npm run example` to run the example. It starts multiple workers and workflows and demonstrates their interaction.
