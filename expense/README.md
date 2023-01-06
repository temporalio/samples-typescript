# Expense Reporting

In this sample, the `expense` Workflow creates the expense (via an activity that POSTs to `localhost:3000/create`) and then waits for a [Signal](https://docs.temporal.io/workflows/#signal) to say whether the expense is approved or rejected:

[`src/workflows.ts`](./src/workflows.ts)

If it's approved, the payment activity is called (which POSTs to `localhost:3000/action`), and then the expense's state should be `COMPLETED` in [localhost:3000/list](http://localhost:3000/list).

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/application-development/foundations#run-a-development-cluster)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. `npm run server.watch` to start the expense HTTP server.
1. In another shell, run one of the execute scripts to start a Workflow:

- `npm run workflow-approve` should print out `Done: { status: 'COMPLETED' }`
- `npm run workflow-timeout` should print out `Done: { status: 'TIMED_OUT' }`
