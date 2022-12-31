# EJSON

Create a [custom payload converter](https://docs.temporal.io/typescript/data-converters#payloadconverter) using [EJSON](https://docs.meteor.com/api/ejson.html), which supports:

- Dates (`Date`)
- Binary (`Uint8Array`)
- Special numbers (`NaN`, `Infinity`, and `-Infinity`)
- Regular expressions (`RegExp`)

## Code

- `EjsonPayloadConverter`: [ejson-payload-converter.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/ejson-payload-converter.ts)
- `payloadConverter`: [payload-converter.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/payload-converter.ts)

The `payload-converter.ts` file is supplied to the [client.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/client.ts) and [worker.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/worker.ts), and when the client sends a `User` argument, [workflow.ts](https://github.com/temporalio/samples-typescript/blob/main/ejson/src/workflow.ts) can receive it.

## Migrating

If you are migrating to `EjsonPayloadConverter` from the default Payload Converter in a production Temporal deployment, you can:

- Redeploy Workers with the new data converter.
- Then redeploy Client code with the new data converter.

Payloads that were encoded with `JsonPayloadConverter` will be decoded by `EjsonPayloadConverter`, as they share the same `encodingType`.

If any of your production Workflows used `Uint8Array` data, add `BinaryPayloadConverter` so those Payloads can be decoded:

```ts
import { BinaryPayloadConverter, CompositePayloadConverter, UndefinedPayloadConverter } from '@temporalio/common';
import { EjsonPayloadConverter } from './ejson-payload-converter';

export const payloadConverter = new CompositePayloadConverter(
  new UndefinedPayloadConverter(),
  new BinaryPayloadConverter(),
  new EjsonPayloadConverter()
);
```

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.

The client script should log:

```bash
Started workflow example-user-67904764-18eb-4011-93b0-85cb04880a69
{ success: true, at: 2022-03-24T00:11:07.509Z }
```
