# AWS SQS Node.js Sample

This sample demonstrates how to use Temporal to process messages from an AWS SQS queue, all within a single container. 
This example uses a FIFO based queue, but it can be modified to use a standard queue.

In essence, this code sets up a system where multiple processes are spawned. Some of these processes are responsible for polling an SQS queue and starting Temporal workflows based on the messages they receive. Another process is responsible for running a Temporal worker that processes these workflows. If any of these processes die, the primary process respawns them.

### Primary-Worker Architecture

The `run`` function sets up a primary-worker architecture using Node's cluster module.

If in the primary process:
- It determines the number of available CPUs.
- Spawns child processes based on the available CPUs. One of these processes is dedicated to running the Temporal worker, while the rest are for polling the SQS queue.
- Listens for child process exits and respawns them if needed.
If in a child process:
- Depending on the worker type, it either polls the SQS queue or runs the Temporal worker.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `pnpm install` to install dependencies (`npm install`).
3. rename `.env.example` to `.env` and fill in the values for your AWS account and queue (FIFO).
4. `npm run start:worker` to start the Worker.
5. In another shell, `npm run start:client` to send a sample SQS message.
6. use `:watch` for development

