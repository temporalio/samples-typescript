# monorepo-folders

This example is meant to help people with alternative folder structures to our hello-world:

```bash
packages/
  backend-apis
  frontend-ui
  temporal-worker/
    worker.ts
  temporal-workflows
    lib/
    src/
      workflowA/
          activities/
            activitiesA.ts
            activitiesB.ts
          workflow.ts
      workflowB/
          activities/
            activitiesA.ts
            activitiesB.ts
          workflow.ts
      all_workflows.ts
      all_activities.ts
node_modules
package.json
```

We built this with `yarn` Workspaces. We expect this structure to work with most monorepo tooling: lerna, pnpm, nx, preconstruct, changesets, and Rush but haven't verified it - we cannot support your build tooling specifics but don't mind receiving feedback in our issues.

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm start` to start the worker. Leave the worker process running.
5. Run `npm run workflow` to run the workflow. It should print out `Hello, Temporal!`
