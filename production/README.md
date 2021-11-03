# production

An example of building your Workflow code bundle at build time and giving that [prebuilt bundle](https://docs.temporal.io/docs/typescript/production-deploy#prebuild-the-worker) to the Worker (in order to reduce Worker startup time).

- Worker code: https://github.com/temporalio/samples-typescript/blob/main/production/src/worker.ts#L5-L11
- Workflow build script: https://github.com/temporalio/samples-typescript/blob/main/production/scripts/build-workflow-bundle.ts

For more production topics, see our [Production & Deployment](https://docs.temporal.io/docs/typescript/production-deploy) docs page.

## Steps to run this sample in development

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm start.watch` to start the worker. Leave the worker process running.
4. Run `npm run workflow` to run the workflow. It should print out `Hello, Temporal!`

## Steps to run in production

1. `npm run build` to build the Worker script and Activities code.
2. `npm run build:workflow` to build the Workflow code bundle.
3. `NODE_ENV=production node lib/worker.js` to run the production Worker.
