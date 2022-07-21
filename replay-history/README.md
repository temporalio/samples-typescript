# Replay History samples

This demo shows you how the Temporal Worker's `runReplayHistory` API can be used to step through and debug Temporal Workflows.

See the associated video for instructions: https://youtu.be/fN5bIL7wc5M

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow and you can see the unexpected `null` value
1. Then run `npm run replayer` (or, if using VS Code, run the debugger script set up for you in `launch.json`) to step through the code.
