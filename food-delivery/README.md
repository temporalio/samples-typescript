# Food Delivery App

Sample application introduced in these blog posts:

- [Building Reliable Distributed Systems in Node.js](https://temporal.io/blog/building-reliable-distributed-systems-in-node)
- [How Durable Execution Works](https://temporal.io/blog/building-reliable-distributed-systems-in-node-js-part-2)

This sample is deployed to:

- Vercel:
  - [temporal.menu](https://temporal.menu/)
  - [drive.temporal.menu](https://drive.temporal.menu/)
- [`apps/worker/`](./apps/worker) is deployed to Render as a [Background Worker](https://render.com/docs/background-workers)
- The Next.js API routes and Worker connect to [Temporal Cloud](https://temporal.io/cloud)

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

For a Java version of the Worker, see [pvsone/food-delivery](https://github.com/pvsone/food-delivery).

### Running this sample

> [!NOTE]
> At this time, this sample only works properly with PNPM.
>
> Basic support is available for `npm` and `yarn`, using distinct script names, e.g. `npm run build:npm`
> or `yarn run build:yarn`, but some of these scripts are known to misbehave.

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `pnpm install` (to install pnpm, run `npm install --global pnpm`)
1. `pnpm dev` to start the Next.js dev servers and the Temporal Worker.
1. Interact with the sites:

- Menu: http://localhost:3000
- Driver portal: http://localhost:3001
