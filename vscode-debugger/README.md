# VS Code Debugger

Use our [VS Code plugin](https://marketplace.visualstudio.com/items?itemName=temporal-technologies.temporalio) to debug a running or completed Workflow Execution. See this blog post for a walkthrough:

[temporal.io/blog/temporal-for-vs-code](https://temporal.io/blog/temporal-for-vs-code)

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to start the Workflow.
