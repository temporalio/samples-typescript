# Continue as New example

This example lets you try out the continueAsNew API. We still need to make these examples more relatable and realistic. If you are planning to write an infinitely long running workflow, please get in touch to validate the design and cutoff points.

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm start` to start the worker. Leave the worker process running.
5. Run `npm run workflow` to run the workflow.

In Temporal Web, you will see a few workflows spun out as new workflows with new event histories:

![image](https://user-images.githubusercontent.com/6764957/139667701-25369e04-5cad-4721-bbff-3d12bf8bfd66.png)
