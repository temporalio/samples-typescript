<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /><a>
</p>

## Description

[Nest](https://github.com/nestjs/nest) framework sample with the [Temporal TypeScript SDK](https://github.com/temporalio/sdk-typescript)

## Installation

```bash
$ npm install
```

## Running the app

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm run worker:watch` to start the Worker.
1. `npm run start` to start the NestJS server.
1. Visit `http://localhost:3000/counter`

Alternative `start` syntaxes:

```bash
# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
