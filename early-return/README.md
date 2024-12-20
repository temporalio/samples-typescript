This sample demonstrates how to use the "Early Return" pattern via update-with-start.

The "Early Return" pattern involves using update-with-start to start a Workflow and send an Update in the
first Workflow Task. The Update handler waits until the Workflow reaches a certain state of interest, and then
returns some data to the caller. The Workflow continues to execute in the background, and the caller has
possession of a `WorkflowHandle` to follow up on the Workflow progress.

In this example, the Workflow represents a financial transaction, and we use Early Return to wait until the
transaction has been confirmed, leaving the Workflow to complete the remaining stages of the transaction in
the background.

### Running this sample

1. `npm install` to install dependencies.
1. Make sure Temporal Server is running locally.
1. `npm run start.watch` to start the Worker.
1  `npm run workflow tx-abc123` to run a transaction workflow, obtaining an "early return" via Update-With-Start.
