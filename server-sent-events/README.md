# Server sent events

This example shows how to integrate an SSE server and Temporal in a simple workflow.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, connect to the running server with `curl localhost:3000/events`.
1. You can do this multiple times to see the broadcast in action.
1. In yet another shell, `npm run workflow some-event "send message"` to send an event to all connected clients. The message should appear in your connected terminal(s)
