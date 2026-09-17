# Server sent events

This example shows how to integrate an SSE server and Temporal in a simple workflow.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run server` to start the server.
1. `PORT=3001 npm run server` to start yet another server in another port.
1. In another shell, connect to the first server with `curl localhost:3000/events?room_id=A`.
1. In yet another shell, connect to the second server (note port 3001) with `curl localhost:3001/events?room_id=A`.
1. In yet _another_ shell, connect to the first server with `curl localhost:3000/events?room_id=B`.
1. In yet another shell, send a message to room A: `curl -XPOST "localhost:3000/events?room_id=A&message=Hi%20room%20A"`. This message will be broadcasted to your first and second shells, even though they are connected through different servers!
1. Now, send a message to room B: `curl -XPOST "localhost:3000/events?room_id=B&message=Hi%20room%20B"`. You should now only see a message pop up in the last shell!
