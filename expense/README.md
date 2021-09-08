# expense

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm run server` to run the dummy HTTP server that stores the status of each expense report. Leave the dummy HTTP server running.
5. Run `npm run worker` to start the worker. Leave the worker process running.
6. Run one of the starters to start the example. `npm run starter-approve` should print out `Done: { status: 'COMPLETED' }`. `npm run starter-timeout` should print out `Done: { status: 'TIMED_OUT' }`