# Scratchpad

This sample demonstrates a minimalistic single-file style that might be useful for quickly sketching out an idea, or for sharing a minimal reproduction of a bug.
Production code should not be arranged like this! See the other samples in this repo for recommended project structure.

### Quickstart

To get started quickly without cloning:

```sh
npm install --save ts-node @temporalio/worker @temporalio/workflow @temporalio/client @temporalio/common
curl -sOL https://raw.githubusercontent.com/temporalio/samples-typescript/main/scratchpad/scratchpad.ts
ts-node scratchpad.ts
```

### Watch changes

If you've cloned this repo locally, you can run:

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to run the single file, [`scratchpad.ts`](scratchpad.ts).

The following will be printed out:

```
Hello, Temporal!
```
