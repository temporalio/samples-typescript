# Continue as New

This sample demonstrates the [continueAsNew API](https://docs.temporal.io/typescript/workflows/#the-continueasnew-api). We still need to make these examples more relatable and realistic. If you are planning to write an infinitely long-running Workflow, please get in touch to validate the design and cutoff points.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `npm install` to install dependencies.
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.

In Temporal Web ([localhost:8088](http://localhost:8088)), you will see 10 Workflows spun out as new Workflows with new event histories and `Continuedasnew` status:

![image](https://user-images.githubusercontent.com/6764957/139667701-25369e04-5cad-4721-bbff-3d12bf8bfd66.png)

Example output:

```
[loopingWorkflow(loop-0)] Running Workflow iteration: 0
[loopingWorkflow(loop-0)] Running Workflow iteration: 1
[loopingWorkflow(loop-0)] Running Workflow iteration: 2
[loopingWorkflow(loop-0)] Running Workflow iteration: 3
[loopingWorkflow(loop-0)] Running Workflow iteration: 4
[loopingWorkflow(loop-0)] Running Workflow iteration: 5
[loopingWorkflow(loop-0)] Running Workflow iteration: 6
[loopingWorkflow(loop-0)] Running Workflow iteration: 7
[loopingWorkflow(loop-0)] Running Workflow iteration: 8
[loopingWorkflow(loop-0)] Running Workflow iteration: 9
```
