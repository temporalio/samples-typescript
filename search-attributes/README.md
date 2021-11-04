# Search Attributes

This example demonstrates usage of custom search attributes with Temporal. This requires an Elasticsearch instance, which comes set up with the default `docker-compose`.

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm start` to start the worker. Leave the worker process running.
5. Run `npm run workflow` to run the workflow.

You can see the search attributes in Temporal Web:

![image](https://user-images.githubusercontent.com/6764957/139664903-9fc3a3a9-7e02-4184-9d19-7de15c9e52d7.png)
