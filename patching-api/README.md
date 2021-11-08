# Patching API

This sample shows how to use the [patching/versioning API](https://docs.temporal.io/docs/typescript/patching/) to update the code of a Workflow that has executions in progress in production.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
2. `npm install` to install dependencies.
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the v1 Workflow.
5. Now we need to simulate a migration: patch in the new code

- Go into [`src/workflows.ts`](./src/workflows.ts) and swap `workflows-v1` for `workflows-v2`.
- Wait for the Worker to rebuild (back in the `npm run start.watch` shell).
- Start a v2 Workflow with `npm run workflow`. This will run alongside the v1 Workflow.
- You can see the deprecation marker recorded in Temporal Web for the v2 Workflow.
  ![image](https://user-images.githubusercontent.com/6764957/139673361-35d61b38-ab94-401e-ae7b-feaa52eae8c6.png)

6. Step 2 of the migration: deprecate the patch

- Manually terminate the v1 Workflow. We only deprecate the patch when all instances of v1 are no longer running.
- Go into `src/workflows.ts` and swap `workflows-v2` for `workflows-v3`.
- Wait for the Worker to rebuild.
- Start a v3 Workflow with `npm run workflow`. This will run alongside the v2 Workflow.

7. Step 3 of the migration: Solely deploy new code

- Manually terminate the v2 Workflow. We only remove the deprecation when all instances of v2 are no longer running.
- Go into `src/workflows.ts` and swap `workflows-v3` for `workflows-vFinal`.
- etc.
