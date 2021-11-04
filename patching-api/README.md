# Patching API demo

This sample shows how to use the [patching/versioning API](https://docs.temporal.io/docs/typescript/patching/) to update the code of a Workflow that has instances in progress in production.

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm start` to start the worker. Leave the worker process running.
5. Run `npm run workflow` to run the v1 workflow.
6. Now we need to simulate a migration: patch in the new code

- Go into `workflows.ts` and swap `workflows-v1` for ``workflows-v2`.
- Kill and restart the worker (`npm start`) to pick up the change.
- Start a v2 workflow with `npm run workflow`. This will run alongside the v1 workflow.
- You can see the deprecation marker recorded in Temporal Web for the v2 workflow.
  ![image](https://user-images.githubusercontent.com/6764957/139673361-35d61b38-ab94-401e-ae7b-feaa52eae8c6.png)

7. Step 2 of the migration: deprecate the patch

- Manually terminate the v1 workflow. We only deprecate the patch when all instances of v1 are no longer running.
- Go into `workflows.ts` and swap `workflows-v2` for ``workflows-v3`.
- Kill and restart the worker (`npm start`) to pick up the change.
- Start a v3 workflow with `npm run workflow`. This will run alongside the v2 workflow.

8. Step 3 of the migration: Solely deploy new code

- Manually terminate the v2 workflow. We only deprecate the deprecation when all instances of v2 are no longer running.
- Go into `workflows.ts` and swap `workflows-v3` for ``workflows-vFinal`.
- etc.
