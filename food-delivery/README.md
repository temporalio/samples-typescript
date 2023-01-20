# Food Delivery App

This sample demonstrates:

- [`packages/workflows/order.ts`](./packages/workflows/order.ts): A food delivery Workflow.
  - Activity retries and non-retryable failures
  - Signals and a Query
  - Timeouts on state changes using `condition()`
- Turborepo monorepo, with shared packages in [`packages/`](./packages) and 3 apps in [`apps/`](./apps):
  - [`apps/menu/`](./apps/menu): Customer app with menu and serverless API. Next.js, Tailwind, tRPC.
  - [`apps/driver/`](./apps/driver): Driver portal for picking up and delivering meals.
  - [`apps/worker/`](./apps/worker): The Worker.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run dev` to start the Next.js dev servers and the Temporal Worker.
1. Interact with the sites:

- Menu: http://localhost:3000
- Driver portal: http://localhost:3001
