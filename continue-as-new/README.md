# Continue as New

This sample demonstrates the [continueAsNew API](https://docs.temporal.io/docs/typescript/workflows/#the-continueasnew-api). We still need to make these examples more relatable and realistic. If you are planning to write an infinitely long-running Workflow, please get in touch to validate the design and cutoff points.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

In Temporal Web ([localhost:8088](http://localhost:8088)), you will see 10 Workflows spun out as new Workflows with new event histories and `Continuedasnew` status:

![image](https://user-images.githubusercontent.com/6764957/139667701-25369e04-5cad-4721-bbff-3d12bf8bfd66.png)
