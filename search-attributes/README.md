# Search Attributes

This sample demonstrates how to add [custom search attributes](https://docs.temporal.io/docs/typescript/search-attributes/) to your Workflow Executions:

[src/client.ts](./src/client.ts)

This requires an Elasticsearch instance, which is included in the default `docker-compose`.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

You can see the search attributes in Temporal Web ([localhost:8088](http://localhost:8088)):

![image](https://user-images.githubusercontent.com/6764957/139664903-9fc3a3a9-7e02-4184-9d19-7de15c9e52d7.png)
