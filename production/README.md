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
2. `npm run build:workflow` to build the Workflow code bundle.
3. `NODE_ENV=production node lib/worker.js` to run the production Worker.

If you use Docker in production, replace step 3 with:

```
docker build . --tag my-temporal-worker --build-arg TEMPORAL_SERVER=host.docker.internal:7233
docker run -p 3000:3000 my-temporal-worker
```

### Connecting to deployed Temporal Server

We use [`src/connection.ts`](./src/connection.ts) for connecting to Temporal Server from both the Client and Worker. When connecting to Temporal Server running on our local machine, the defaults (`localhost:7233` for `node lib/worker.js` and `host.docker.internal:7233` for Docker) work. When connecting to a production Temporal Server, we need to:

- Provide the GRPC endpoint, like `TEMPORAL_SERVER=loren.temporal-dev.tmprl.cloud:7233`
- Provide the namespace, like `NAMESPACE=loren.temporal-dev`
- Put the TLS certificate in `certs/server.pem`
- Put the TLS private key in `certs/server.key`
- If using Docker, mount `certs/` into the container by adding `--mount type=bind,source="$(pwd)"/certs,target=/app/certs` to `docker run`

With Docker, the full commands would be:

```
docker build . --tag my-temporal-worker --build-arg TEMPORAL_SERVER=loren.temporal-dev.tmprl.cloud:7233 --build-arg NAMESPACE=loren.temporal-dev
docker run -p 3000:3000 --mount type=bind,source="$(pwd)"/certs,target=/app/certs my-temporal-worker
```
