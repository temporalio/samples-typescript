# monorepo-folders

This example is meant to demonstrate a realistic monorepo folder structure where:

- `frontend-ui` contains the frontend UI that calls some backend APIs (we use Create-React-App)
- `backend-apis` contains all the backend API routes (we use Express.js here, but could easily be a set of serverless functions)
  - Some routes have a Temporal Client that calls workflows
- `temporal-worker` has independently scalable Workers that have Workflows and Activities registered
- `temporal-workflows` is a shared source folder containing Workflow and Activity code that is used by both the Client in `backend-apis` and the Worker in `temporal-worker`

```bash
packages/
  backend-apis/
    server.ts # runs Express server on localhost:4000
  frontend-ui # this is a Create-React-App on localhost:3000, proxies api requests to :4000
  temporal-worker/
    worker.ts # registers Temporal Worker that has Workflows and Activities from /temporal-workflows
  temporal-workflows/
    lib/ # compiled workflows
    src/
      workflowA/
          activities/
            activitiesA.ts
            activitiesB.ts
          workflow.ts
      workflowB/
          activities/
            activitiesC.ts
            activitiesD.ts
          workflow.ts
      all_workflows.ts
      all_activities.ts
node_modules
package.json
```

Notes on the structure demonstrated:

- **Workflows require one file**: you can organize Workflow code however you like, but each Worker needs to reference a single file that exports all the Workflows it handles (so you have to handle name conflicts instead of us)
- **Activities are top level**:
  - Inside the Temporal Worker, Activities are registered at the same level Workflows are.
  - Since Activities are required, not bundled, Activities don't need to be exported in a single file.
    Just make sure they are registered with some Workers if you intend them to be executed.
  - You can organize activities however you like, but it is important to understand that activities don't "belong" to workflows as far as Temporal is concerned.

We built this with `yarn` Workspaces. We expect this structure to work with most monorepo tooling: lerna, pnpm, nx, preconstruct, changesets, and Rush but haven't verified it - we cannot support your build tooling specifics but don't mind receiving feedback in our issues.

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/server/quick-install) to do that.
2. Run `yarn` to install dependencies.
3. Run `yarn start` to compile the project, and concurrently start the worker, frontend, and backend server
4. Open up the UI `localhost:3000` and click the button:

![image](https://user-images.githubusercontent.com/6764957/140593030-43b74199-8636-473e-8292-b5dfaa12b131.png)

This calls `localhost:3000/api/workflow`...

- which CRA proxies to `localhost:4000/api/workflow` and is handled by the Express.js server in `backend-apis`.
- The `/api/workflow` route handler has a Temporal Client which executes WorkflowA and starts WorkflowB.

You can see the logs in the terminal output:

```bash
[worker] [WorkflowA(a19adbef-9e67-416a-ada6-234e73081e74)] Hello from WorkflowA
[worker] hello from activityA Temporal
[worker] hello from activityB Temporal
[api-server] A: ActivityA result: A-Temporal!, B: ActivityB result: B-Temporal!
[api-server] GET /api/workflow 200 2081.536 ms - 79
[worker] [WorkflowB(68f37547-5e72-46ea-8fd0-54c3adddee53)] Hello from WorkflowB
[worker] hello from activityC in WorkflowB
[worker] hello from activityD in WorkflowB
```

Both the `temporal-worker` and the backend `api-server` have been set up to reload whenever `temporal-workflows` are edited, with `nodemon`.

The workflow code and logs aren't meant to be meaningful, the important thing is that we show how all 4 packages in this monorepo can realistically work together with Temporal spread across 3 of packages in the monorepo.
