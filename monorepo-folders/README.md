# monorepo-folders

This example is meant to help people with alternative folder structures to our hello-world:

```bash
packages/
  backend-apis/
    server.ts # runs Express server on localhost:4000, has Temporal Client that calls workflows
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
      workflowE.ts
      all_workflows.ts
      activityF.ts
node_modules
package.json
```

Notes on the structure demonstrated:

- **Workflows require one file**: you can organize workflows however you like, but you need to export them all in a single file per Worker (so that the Worker's webpack has an entry point)
- **Activities are top level**:
  - Inside Temporal Server, Activities are registered at the same level Workflows are.
  - Since Activities are required, not bundled, Activities don't need to be exported in a single file.
    Just make sure they are registered with some Workers if you intend them to be executed.
  - You can organize activities however you like, but it is important to understand that activities don't "belong" to workflows as far as Temporal is concerned.

We built this with `yarn` Workspaces. We expect this structure to work with most monorepo tooling: lerna, pnpm, nx, preconstruct, changesets, and Rush but haven't verified it - we cannot support your build tooling specifics but don't mind receiving feedback in our issues.

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `yarn` to install dependencies.
3. Run `yarn start` to compile the project, and concurrently start the worker, frontend, and backend server
4. Open up the UI `localhost:3000` and click the button:

![image](https://user-images.githubusercontent.com/6764957/140593030-43b74199-8636-473e-8292-b5dfaa12b131.png)

This calls `localhost:3000/api/workflow` which CRA proxies to `localhost:4000/api/workflow` and is handled by the Express.js server in `backend-apis`.
The route handler has a Temporal Client which executes WorkflowA and starts WorkflowB.
You can see the logs in the terminal output:

```bash
[2] hello from A Temporal
[2] hello from B Temporal
[1] Hello, Temporal! Hello, Temporal!
[1] GET /api/workflow 200 1049.024 ms - 46
[2] hello from C defaultWorkflowBName
[2] hello from D defaultWorkflowBName
```

This code isn't meant to be meaningful, the important thing is that we show how all 4 packages in this monorepo can realistically work together with Temporal spread across 3 of them.
