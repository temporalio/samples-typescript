# Saga

This sample demonstrates orchestrating microservices using a very simplistic Saga pattern.

## Use Case

The `openAccount` Workflow opens a new bank account. It coordinates between the Clients, Accounts, Banking, and
PostOffice services. In this example, the service clients _are_ Activities being orchestrated.

When one of the Activities fails, the Workflow will "compensate" by calling Activities configured
as reversals of successful calls to that point. Note that compensation is done in reverse order.

### Running this sample

1. Either use Temporal Cloud with environment variables specified [here](https://docs.temporal.io/security/#encryption-in-transit-with-mtls) or make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/application-development/foundations#run-a-development-cluster)) and add `LOCAL=true`.
1. `npm install` to install dependencies.
1. `LOCAL=true npm run start` to start the Worker.
1. In another shell, `LOCAL=true npm run workflow` to run the Workflow.
1. In the first shell, watch the Worker output for a few seconds:

```
2022-05-17T19:34:32.102Z [INFO] Worker state changed { state: 'RUNNING' }
CREATING ACCOUNT { accountId: 'cl3ak0irb0000imsmhjde2x5f' }
ADDING ADDRESS {
  accountId: 'cl3ak0irb0000imsmhjde2x5f',
  address: { address1: '123 Temporal Street', postalCode: '98006' }
}
ADDING CLIENT {
  accountId: 'cl3ak0irb0000imsmhjde2x5f',
  clientEmail: 'bart@simpson.io'
}
workflow:  f508b554-3606-44e8-a460-97a47f0224e4 message:  add bank account failed:
workflow:  f508b554-3606-44e8-a460-97a47f0224e4 message:  failures encountered during account opening - compensating
workflow:  f508b554-3606-44e8-a460-97a47f0224e4 message:  reversing add client:
REMOVING CLIENT { accountId: 'cl3ak0irb0000imsmhjde2x5f' }
workflow:  f508b554-3606-44e8-a460-97a47f0224e4 message:  reversing add address:
CLEARING ADDRESSES { accountId: 'cl3ak0irb0000imsmhjde2x5f' }
```

1. In the other shell, where the client code is running (`LOCAL=true npm run workflow`).

```
> saga@0.1.0 workflow
> ts-node src/client.ts

account failed to open WorkflowFailedError: Workflow execution failed
    at WorkflowClient.result (/Users/me/gh/samples-typescript/saga/node_modules/@temporalio/client/src/workflow-client.ts:457:15)
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
    at async run (/Users/me/gh/samples-typescript/saga/src/client.ts:39:3) {
  cause: [TemporalFailure: Activity execution failed] {
    cause: Error: add bank account failed:
        at Activity.addBankAccount [as fn] (/Users/me/gh/samples-typescript/saga/src/clients/index.ts:30:13) {
      cause: undefined,
      name: 'ApplicationFailure',
      type: 'Error',
      nonRetryable: false,
      details: [],
      failure: [Object]
    },
    activityType: 'addBankAccount',
    activityId: '4',
    retryState: 3,
    identity: '35653@mbp-2.local',
    failure: {
      message: 'Activity task failed',
      cause: [Object],
      activityFailureInfo: [ActivityFailureInfo],
      applicationFailureInfo: undefined,
      timeoutFailureInfo: undefined,
      canceledFailureInfo: undefined,
      resetWorkflowFailureInfo: undefined
    }
  },
  retryState: 5
}
```
