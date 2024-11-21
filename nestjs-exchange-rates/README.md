<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /><a>
</p>

## Description

[Nest](https://github.com/nestjs/nest) framework sample with the [Temporal TypeScript SDK](https://github.com/temporalio/sdk-typescript).

This sample app is based on this [blog post about caching API requests with long-lived Workflows](https://temporal.io/blog/caching-api-requests-with-long-lived-workflows).

## Installation

```bash
npm install
```

Create an `.env` file from the `.env.template` and chose `dev` or `production`.

- `dev` must be used for testing purposes only
- `production` must be used for production in order to have compiled workflows

Note: you can't start your worker with `npm run start:worker` in production mode.

## Running the app

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `npm run start:worker` to start the Worker.
3. `npm run start:server` to start the NestJS server.
4. Visit `http://localhost:3000/exchange-rates/AUD` to see the most recent exchange rate for AUD (Australian Dollar)

## Building the app

For production optimized builds, webpack is used to squash the files into a big `main.js` under the folders `dist/apps/server/` and `dist/apps/worker/`

1. `npm run build:server:prod`
2. `npm run build:worker:prod`

You can locally test your builds before deploying to another server or to the cloud with:

1. `npm run start:server:prod`
2. `npm run start:worker:prod`
