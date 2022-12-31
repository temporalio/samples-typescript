# Hello World in JavaScript

This is the JavaScript version of our Hello World sample.

The [Hello World Tutorial](https://docs.temporal.io/typescript/hello-world/) walks through the TypeScript version of this sample.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
Hello, Temporal!
```
