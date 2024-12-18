# Hello World with mTLS

This example shows how to secure your Temporal application with [mTLS](https://docs.temporal.io/security/#encryption-in-transit-with-mtls).
This is required to connect with Temporal Cloud or any production Temporal deployment.

### Running this sample

See the [mTLS tutorial](https://legacy-documentation-sdks.temporal.io/typescript/security/#mtls-tutorial).

On step 8, run `npm run start` to start the Worker.
On step 9, in another shell, enter `npm run workflow` to run the Workflow. It should print out `Hello, Temporal!`
