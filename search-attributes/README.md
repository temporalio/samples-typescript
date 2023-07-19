# Search Attributes

> Background: [Search Attribute docs](https://docs.temporal.io/dev-guide/typescript/observability#visibility)

### Adding to Server

```
npm run create-attributes
```

This runs [`src/client-operator-service.ts`](./src/client-operator-service.ts), which adds two custom Search Attributes to Temporal Server.

### Adding to Workflow and using

- Client: [`src/client.ts`](./src/client.ts)
  - Add [custom search attributes](https://docs.temporal.io/dev-guide/typescript/observability#custom-search-attributes) to your Workflow Executions on start
  - Use `describe()` to read search attributes
- Workflow: [`src/workflows.ts`](./src/workflows.ts)
  - Read search attributes from `WorkflowInfo`
  - Upsert search attributes

This requires an Elasticsearch instance, which is included in the default `docker-compose`.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

You can see the search attributes in Temporal Web ([localhost:8088](http://localhost:8088)):

![image](https://user-images.githubusercontent.com/6764957/139664903-9fc3a3a9-7e02-4184-9d19-7de15c9e52d7.png)

Example output:

```
hello workflow
```
