<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /><a>
</p>

## Description

[Nest](https://github.com/nestjs/nest) framework sample with the [Temporal TypeScript SDK](https://github.com/temporalio/sdk-typescript).

This sample app is based on this [blog post about caching API requests with long-lived Workflows](https://temporal.io/blog/caching-api-requests-with-long-lived-workflows).

## Installation

```bash
$ npm install
```

## Running the app

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm run worker` to start the Worker.
1. `npm run start` to start the NestJS server.
1. Visit `http://localhost:3000/exchange-rates/AUD` to see the most recent exchange rate for AUD (Australian Dollar)
