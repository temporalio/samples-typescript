# Saga

This sample demonstrates orchestrating microservices using a simple Saga pattern.

## Use Case

The act of `OpenAccount` for a company shows coordinating between Clients, Accounts, Banking, and
PostOffice services. In this example, the service clients _are_ activities being orchestrated.

Docs: [Activity heartbeating](https://docs.temporal.io/docs/typescript/activities#heartbeating) and [cancellation](https://docs.temporal.io/docs/typescript/activities#activity-cancellation)

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.
1. In the first shell, watch the Worker output for a few seconds:

1. In the other shell, where the client code is running (`npm run workflow`).
