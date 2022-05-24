# grpc calls

Under the hood of a `WorkflowClient`, the `Connection` is actually powered by a `WorkflowService` driver that makes the raw gRPC calls to Temporal Server.

This Service is capable of making a wider range of introspection calls (as per [the API reference](https://typescript.temporal.io/api/classes/proto.temporal.api.workflowservice.v1.WorkflowService-1#methods)).

This demo shows you how to make those raw gRPC calls to Temporal Server.
Just look at `client.ts` as that's the only thing that is different.
Full docs are available at https://docs.temporal.io/typescript/clients/#advanced-making-raw-grpc-calls

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.
