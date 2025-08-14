# Schedules

Schedules are for scheduling Workflows to be run at specific times in the future.

- [Concepts ▶️ Schedules](https://docs.temporal.io/workflows#schedule)
- [`ScheduleClient` API reference](https://typescript.temporal.io/api/classes/client.ScheduleClient)

In this sample, a reminder Workflow ([`src/workflows.ts`](src/workflows.ts)) is scheduled to run every 10 seconds with:

- `npm run schedule.start`: [`src/start-schedule.ts`](src/start-schedule.ts)

You can see each Workflow Execution [in the UI](http://localhost:8233/namespaces/default/workflows?search=basic&query=WorkflowType%3D%22reminder%22):

![Screenshot of the Workflows page of the Temporal Web UI](https://user-images.githubusercontent.com/251288/210159469-12911191-f4be-4da1-9845-1bcaed48304b.png)

You can interact with the running Schedule using these scripts:

- `npm run schedule.go-faster`: [`src/go-faster.ts`](src/go-faster.ts)
- `npm run schedule.pause`: [`src/pause-schedule.ts`](src/pause-schedule.ts)
- `npm run schedule.unpause`: [`src/unpause-schedule.ts`](src/unpause-schedule.ts)
- `npm run schedule.delete`: [`src/delete-schedule.ts`](src/delete-schedule.ts)

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#getting-started).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run schedule.start` to start the Schedule.

It should output:

```bash
Started schedule 'sample-schedule'.

The reminder Workflow will run and log from the Worker every 10 seconds.

You can now run:

  npm run schedule.go-faster
  npm run schedule.pause
  npm run schedule.unpause
  npm run schedule.delete
  npm run schedule.describe
  npm run schedule.backfill
  npm run schedule.list
  npm run schedule.trigger
  npm run schedule.update
```
