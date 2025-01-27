# Sleep for days

This sample demonstrates how to use Temporal to run a workflow that periodically sleeps for a number of days.

### Testing

- Jest: `npm run test`:
  - [`src/test/workflows.test.ts`](./src/test/workflows.test.ts)

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `npm install` to install dependencies.
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow Client.

This sample will run indefinitely until you send a `complete` signal to the workflow. See how to send a signal via Temporal CLI [here](https://docs.temporal.io/cli/workflow#signal).
