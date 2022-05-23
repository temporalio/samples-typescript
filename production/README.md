# Production

An example of building your Workflow code bundle at build time and giving that [prebuilt bundle](https://docs.temporal.io/typescript/production-deploy#prebuild-the-worker) to the Worker (in order to reduce Worker startup time).

- Worker code: [`src/worker.ts`](./src/worker.ts)
- Workflow build script: [`src/scripts/build-workflow-bundle.ts`](./src/scripts/build-workflow-bundle.ts)

For more production topics, see our [Production & Deployment](https://docs.temporal.io/typescript/production-deploy) docs page.

### Running this sample in development

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
Hello, Temporal!
```

### Running this sample in production

1. `npm run build` to build the Worker script and Activities code.
1. `npm run build:workflow` to build the Workflow code bundle.
1. `NODE_ENV=production node lib/worker.js` to run the production Worker.
