# Activities examples

This sample shows usecases for activities:

- `makeHTTPRequest`: fetch an external API
- fakeProgress (tbc)
- cancellableFetch (tbc)

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm start` to start the worker. Leave the worker process running.
5. Run `npm run workflow` to run the workflow. It should print out `The answer is 42` after making an HTTP request to [httpbin.org](https://httpbin.org/).
