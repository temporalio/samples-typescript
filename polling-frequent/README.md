# Frequently Polling Activity

This sample shows how we can implement frequent polling (1 second or faster) inside our Activity. The implementation is a loop that polls our service and then sleeps for the poll interval (1 second in the sample).

To ensure that polling Activity is restarted in a timely manner, we make sure that it heartbeats on every iteration. Note that heartbeating only works if we set the `HeartbeatTimeout` to a shorter value than the Activity `StartToCloseTimeout` timeout.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.

The Workflow will call the activity and it will call the test service.
The test service will either succeed or fail by generating a random number between 0 and 1:
if less than .2, then it will succeed; otherwise it will fail.
It logs the generated numbers, and when it succeeds, it will log `Hello, Temporal!`.
