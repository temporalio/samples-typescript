# EJSON

Create a [custom payload converter](https://docs.temporal.io/docs/typescript/data-converters#payloadconverter).

- Implementation: [ejson-payload-converter.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/ejson-payload-converter.ts)
- Payload Converter file: [payload-converter.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/payload-converter.ts)

The Payload Converter is supplied to the [client.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/client.ts) and [worker.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/worker.ts), and when the client sends a `User` argument, [`workflow.ts`](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/workflow.ts) can receive it.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.

The client should log the Workflow ID that is started, and you should see it reflected in Temporal Web UI.

Optionally, you can also uncomment the `await handle.result()`, rerun, and see the client script return:

```bash
Started workflow example-user-67904764-18eb-4011-93b0-85cb04880a69
{ success: true, at: 2022-03-24T00:11:07.509Z }
```
