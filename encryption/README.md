# Encryption

Create a custom data converter that encrypts data with AES. See [encryption docs](https://docs.temporal.io/typescript/data-converters#encryption).

## Code

- `EncryptionCodec`: [encryption-codec.ts](./src/encryption-codec.ts)
- Data Converter: [data-converter.ts](./src/data-converter.ts)
- Codec Server: [codec-server.ts](./src/codec-server.ts)

  - Run the Codec Server with `npm run codec-server`, it will listen to port 8888.

  To view the decrypted payloads in the web UI:

  - Click the `Configure data encoder` icon on the bottom left, and set `http://localhost:8888` as the `Remote Codec Endpoint`.
  - Or add this environment variable to the web UI server: `TEMPORAL_CODEC_ENDPOINT=http://localhost:8888`.

  To encrypt payloads with `tctl`, pass the following option:

  - `tctl --codec_endpoint 'http://localhost:8888' ...`

The Payload Converter is supplied to the [client.ts](./src/client.ts) and [worker.ts](./src/worker.ts). When the Client sends `'Alice: Private message for Bob.'` to the Workflow, it gets encrypted on the Client and decrypted in the Worker. [`workflow.ts`](./src/workflow.ts) receives the decrypted message and appends another message. When it returns that longer string, the string gets encrypted by the Worker and decrypted by the Client.

## Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.

The client script should log:

```
Started workflow my-business-id-840774ec-f934-4bca-89ad-472b6b117dae
Decrypting payload.data: <Buffer f6 71 42 4c 9f d3 97 bc e5 62 23 dd ea 9c 88 d0 cc 43 8e 69 70 08 f1 fb 33 be 76 b1 e4 b5 04 ac f9 62 a9 d3 b4 a1 80 0a 0f 66 dc c4 b1 90 44 6f 3b 47 ... 44 more bytes>
Alice: Private message for Bob.
Bob: Hi Alice, I'm Workflow Bob.
```
