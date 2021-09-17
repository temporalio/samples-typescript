# http

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm run worker` to start the worker. Leave the worker process running.
5. Run `npm run schedule-workflow` to start the example. Should print out a number between 0 and 100, followed by 100.
