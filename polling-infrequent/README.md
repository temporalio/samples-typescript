# Infrequently Polling Activity

This sample shows how to use Activity retries for infrequent polling of a third-party service (for example via REST). This method can be used for infrequent polls of one minute or slower.

Activity retries are utilized for this option, setting the following Retry options:

- `BackoffCoefficient`: to 1
- `InitialInterval`: to the polling interval (in this sample set to 5 seconds for convenience, but would be at least 60 seconds in real world situations)

This will enable the Activity to be retried on the set interval.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.

The Workflow will call the activity and it will call the test service.
The test service will either succeed or fail by generating a random number between 0 and 1:
if less than .2, then it will succeed; otherwise it will fail.
It logs the generated numbers, and when it succeeds, it will log `Hello, Temporal!`.
