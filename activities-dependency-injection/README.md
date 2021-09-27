# Activities dependency injection example

This sample shows how to share dependencies between activities, for example when you need to initialize a database connection once and then pass it to multiple dependencies.

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm start.watch` to start the worker and reload on changes. Leave the worker process running.
4. Run `npm run execute-workflow` to start the example Workflow. Should print out "Hola, Temporal".
