# Food Delivery App

This sample demonstrates:

- [`packages/workflows/order.ts`](./packages/workflows/order.ts): A food delivery Workflow.
  - Activity retries and non-retryable failures
  - Signals and a Query
  - Timeouts on state changes using `condition()`
- List Workflow API in the [`getOrders`](./apps/driver/pages/api/%5Btrpc%5D.ts) API route handler.
- Turborepo monorepo, with shared packages in [`packages/`](./packages) and 3 apps in [`apps/`](./apps):
  - [`apps/menu/`](./apps/menu): Customer app with menu and serverless API. Next.js, Tailwind, tRPC.
  - [`apps/driver/`](./apps/driver): Driver portal for picking up and delivering meals.
  - [`apps/worker/`](./apps/worker): The Worker.
  - [`apps/driver/pages/api/[trpc].ts`](./apps/driver/pages/api/[trpc].ts): The [client.workflow.list](https://typescript.temporal.io/api/classes/client.WorkflowClient#list) API.

This sample is deployed to:

- Vercel:
  - [temporal.menu](https://temporal.menu/)
  - [drive.temporal.menu](https://drive.temporal.menu/)
- [`apps/worker/`](./apps/worker) is deployed to Render as a [Background Worker](https://render.com/docs/background-workers)
- The Next.js API routes and Worker connect to [Temporal Cloud](https://temporal.io/cloud)

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run dev` to start the Next.js dev servers and the Temporal Worker.
1. Interact with the sites:

- Menu: http://localhost:3000
- Driver portal: http://localhost:3001
