# Protobufs

Use [Protobufs](https://docs.temporal.io/application-development/observability?lang=typescript#tracing).

- Example proto files:
  - [protos/messages.proto](protos/messages.proto)
  - [protos/namespaced-messages.proto](protos/namespaced-messages.proto)
- Scripts for compiling protos: [package.json](package.json)
- Root file: [protos/root.js](protos/root.js)
- Payload Converter: [src/payload-converter.ts](src/payload-converter.ts)

We provide the Payload Converter to the Client ([src/client.ts](src/client.ts)) and Worker ([src/worker.ts](src/worker.ts)), and then we can use Protobufs in the Client, Workflow ([src/workflows.ts](src/workflows.ts)), and Activity ([src/activities.ts](src/activities.ts)).

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.

The client should log the Workflow ID that is started, and you should see it reflected in Temporal Web UI.

Optionally, you can also uncomment the `await handle.result()`, rerun, and see the client script return:

```bash
Started workflow my-business-id-b6155489-920f-41a8-9e88-c17c24d47ee9
{ sentence: 'Proto is 2 years old.' }
```
