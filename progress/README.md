# http

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies
3. Run `npm start` to start the worker. Leave the worker process running.
4. Run `npm run schedule-workflow` to start the example. Should print out a number between 0 and 100, followed by 100.