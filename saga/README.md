# Saga

This sample demonstrates orchestrating microservices using a very simplistic Saga pattern.

## Use Case

The act of `OpenAccount` for a company shows coordinating between Clients, Accounts, Banking, and
PostOffice services. In this example, the service clients _are_ activities being orchestrated.

When one of the activities fails, the workflow will "compensate" by calling activities configured
as reversals of successful calls to that point. Note that compensation is done in reverse order.

### Running this sample

1. Either use Temporal Cloud with environment variables specified [here](https://docs.temporal.io/docs/typescript/security/#connecting-to-temporal-cloud-with-mtls) or make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.
1. In the first shell, watch the Worker output for a few seconds:

1. In the other shell, where the client code is running (`npm run workflow`).
