# Batch Iterator

A sample implementation of the Workflow iterator pattern.

A workflow starts a configured number of Child Workflows in parallel. Each child processes a single record.
After all children close (complete or fail), the parent calls continue-as-new and starts the children for the next page of records.

The parent tracks and returns the total number of records processed and the number of failed ones.

This allows processing a set of records of any size. The advantage of this approach is simplicity.
The main disadvantage is that it processes records in batches, with each batch waiting for the slowest child workflow.

A variation of this pattern runs activities instead of child workflows.

## Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. Navigate to the parent directory (`batch`), in the parent directory:
   1. `npm install` to install dependencies.
   2. `npm run start-iterator.watch` to start the Worker.
   3. In another shell, `npm run workflow-iterator` to run the Workflow.
