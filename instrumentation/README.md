# Instrumentation demo

This project demonstrates how to add a [winston](https://github.com/winstonjs/winston) logger to your project and get metrics, logs and traces out of the SDK.

The [Logging docs](https://docs.temporal.io/typescript/logging/) and [Core docs](https://docs.temporal.io/typescript/core/) explain some of the code in this sample.

See the [opentelemetry interceptors sample](https://github.com/temporalio/samples-typescript/tree/main/interceptors-opentelemetry) for adding tracing to your own Activities and Workflows.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

<details>
<summary>
Sample worker output
</summary>

```
[nodemon] starting `ts-node src/worker.ts`
2021-11-24T15:53:34.658Z [worker] info: [temporal_sdk_core] Registering worker task_queue="instrumentation"
2021-11-24T15:53:35.976Z [worker] info: assets by status 4.66 KiB [compared for emit]
2021-11-24T15:53:35.976Z [worker] info:   assets by path ../Users/bergundy/temporal/samples-node/instrumentation/lib/workflows/ 2.34 KiB
2021-11-24T15:53:35.976Z [worker] info:     assets by path ../Users/bergundy/temporal/samples-node/instrumentation/lib/workflows/*.map 1.21 KiB 3 assets
2021-11-24T15:53:35.976Z [worker] info:     assets by path ../Users/bergundy/temporal/samples-node/instrumentation/lib/workflows/*.ts 1.13 KiB 3 assets
2021-11-24T15:53:35.976Z [worker] info:   assets by path ../Users/bergundy/temporal/samples-node/instrumentation/lib/activities/ 1.69 KiB
2021-11-24T15:53:35.976Z [worker] info:     assets by path ../Users/bergundy/temporal/samples-node/instrumentation/lib/activities/*.ts 907 bytes 2 assets
2021-11-24T15:53:35.976Z [worker] info:     assets by path ../Users/bergundy/temporal/samples-node/instrumentation/lib/activities/*.map 821 bytes 2 assets
2021-11-24T15:53:35.976Z [worker] info:   assets by path ../Users/bergundy/temporal/samples-node/instrumentation/lib/*.ts 409 bytes 3 assets
2021-11-24T15:53:35.976Z [worker] info:   assets by path ../Users/bergundy/temporal/samples-node/instrumentation/lib/*.map 232 bytes
2021-11-24T15:53:35.976Z [worker] info:     asset ../Users/bergundy/temporal/samples-node/instrumentation/lib/client.d.ts.map 126 bytes [compared for emit]
2021-11-24T15:53:35.976Z [worker] info:     asset ../Users/bergundy/temporal/samples-node/instrumentation/lib/worker.d.ts.map 106 bytes [compared for emit]
2021-11-24T15:53:35.976Z [worker] info: assets by status 2.52 MiB [emitted]
2021-11-24T15:53:35.976Z [worker] info:   asset main.js 2.52 MiB [emitted] (name: main)
2021-11-24T15:53:35.976Z [worker] info:   asset ../Users/bergundy/temporal/samples-node/instrumentation/lib/logging.d.ts.map 313 bytes [emitted]
2021-11-24T15:53:35.976Z [worker] info: runtime modules 1.98 KiB 5 modules
2021-11-24T15:53:35.976Z [worker] info: modules by path ./node_modules/ 984 KiB
2021-11-24T15:53:35.976Z [worker] info:   modules by path ./node_modules/@temporalio/ 867 KiB 25 modules
2021-11-24T15:53:35.976Z [worker] info:   modules by path ./node_modules/protobufjs/ 51.2 KiB
2021-11-24T15:53:35.976Z [worker] info:     modules by path ./node_modules/protobufjs/src/*.js 28.8 KiB 7 modules
2021-11-24T15:53:35.976Z [worker] info:     modules by path ./node_modules/protobufjs/src/util/*.js 17.7 KiB 2 modules
2021-11-24T15:53:35.976Z [worker] info:     2 modules
2021-11-24T15:53:35.976Z [worker] info:   modules by path ./node_modules/@protobufjs/ 23.7 KiB 7 modules
2021-11-24T15:53:35.976Z [worker] info:   ./node_modules/long/src/long.js 39.2 KiB [built] [code generated]
2021-11-24T15:53:35.976Z [worker] info:   ./node_modules/ms/index.js 2.95 KiB [built] [code generated]
2021-11-24T15:53:35.976Z [worker] info: modules by path ./src/workflows/*.ts 3.42 KiB
2021-11-24T15:53:35.976Z [worker] info:   ./src/workflows/index.ts 1.3 KiB [built] [code generated]
2021-11-24T15:53:35.976Z [worker] info:   ./src/workflows/interceptors.ts 1.02 KiB [built] [code generated]
2021-11-24T15:53:35.976Z [worker] info:   ./src/workflows/logger.ts 1.09 KiB [built] [code generated]
2021-11-24T15:53:35.976Z [worker] info: ../../../../../src/main.js 933 bytes [built] [code generated]
2021-11-24T15:53:35.976Z [worker] info: webpack 5.64.2 compiled successfully in 1130 ms
2021-11-24T15:53:35.978Z [worker] info: Workflow bundle created { size: '2.52MB' }
2021-11-24T15:53:36.170Z [worker] info: Worker state changed { state: 'RUNNING' }
2021-11-24T15:53:36.171Z [worker] debug: [temporal_sdk_core] poll_workflow_activation; task_queue="instrumentation"
2021-11-24T15:53:36.172Z [worker] debug: [temporal_sdk_core] poll_activity_task; task_queue="instrumentation"
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::workflow::workflow_tasks] Applying new workflow task from server task_token=CiRkM2VlN2Y0Zi0zM2I4LTQ4OTQtYTAzMC04ZTA5ZTQ1NDEyYTISGGluc3RydW1lbnRhdGlvbi1zYW1wbGUtMBokYTViZTQyN2MtY2M0ZC00ZjI4LWE0MDctMzNjZGExNmQxYWI3IAIoAQ== history_length=3
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::workflow::workflow_tasks::concurrency_manager] create_or_update machines; run_id=a5be427c-cc4d-4f28-a407-33cda16d1ab7
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] handling non-stateful event event=HistoryEvent(id: 1, Some(WorkflowExecutionStarted))
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::workflow::driven_workflow] Driven WF start run_id=a5be427c-cc4d-4f28-a407-33cda16d1ab7
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] handling non-stateful event event=HistoryEvent(id: 2, Some(WorkflowTaskScheduled))
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::machines] handling event event=HistoryEvent(id: 2, Some(WorkflowTaskScheduled)) machine_name=WorkflowTaskMachine state=Created
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::machines] handling event event=HistoryEvent(id: 3, Some(WorkflowTaskStarted)) machine_name=WorkflowTaskMachine state=Scheduled
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::machines] Machine produced commands commands=[WFTaskStartedTrigger] state=Started machine_name=WorkflowTaskMachine
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] Machine produced responses responses=[TriggerWFTaskStarted] machine_name=WorkflowTask
2021-11-24T15:53:45.432Z [worker] debug: [temporal_sdk_core::worker] Sending activation to lang activation=WfActivation(run_id: a5be427c-cc4d-4f28-a407-33cda16d1ab7, is_replaying: false, jobs: StartWorkflow)
null [worker] debug: Got workflow activation {
  runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7',
  jobs: [
    WFActivationJob {
      startWorkflow: StartWorkflow {
        arguments: [],
        headers: {},
        workflowType: 'logSampleWorkflow',
        workflowId: 'instrumentation-sample-0',
        randomnessSeed: Long { low: 435029637, high: -1392907918, unsigned: true }
      }
    }
  ]
}
2021-11-24T15:53:45.434Z [worker] debug: Creating workflow {
  workflowType: 'logSampleWorkflow',
  workflowId: 'instrumentation-sample-0',
  runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7'
}
2021-11-24T15:53:45.434Z [worker] debug: [temporal_sdk_core] poll_workflow_activation; task_queue="instrumentation"
2021-11-24T15:53:45.463Z [worker] debug: Completed activation { runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7' }
2021-11-24T15:53:45.463Z [worker] debug: [temporal_sdk_core] complete_workflow_activation; completion=WfActivationCompletion(run_id: a5be427c-cc4d-4f28-a407-33cda16d1ab7, status: Success(ScheduleActivity )) run_id=a5be427c-cc4d-4f28-a407-33cda16d1ab7
2021-11-24T15:53:45.463Z [worker] debug: [temporal_sdk_core::workflow::bridge] wf bridge iteration fetch in_cmds=[AddActivity(ScheduleActivity { seq: 1, activity_id: "1", activity_type: "greet", namespace: "", task_queue: "instrumentation", header_fields: {}, arguments: [Payload { metadata: {"encoding": [106, 115, 111, 110, 47, 112, 108, 97, 105, 110]}, data: [34, 84, 101, 109, 112, 111, 114, 97, 108, 34] }], schedule_to_close_timeout: None, schedule_to_start_timeout: None, start_to_close_timeout: Some(Duration { seconds: 300, nanos: 0 }), heartbeat_timeout: None, retry_policy: None, cancellation_type: TryCancel })]
2021-11-24T15:53:45.463Z [worker] debug: [temporal_sdk_core::machines] handling command command_type=ScheduleActivityTask machine_name=ActivityMachine state=ScheduleCommandCreated
2021-11-24T15:53:45.463Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] prepared commands commands=[Cmd&Machine(ScheduleActivityTask)]
2021-11-24T15:53:45.463Z [worker] debug: [temporal_sdk_core::worker] Sending commands to server: [Command { command_type: ScheduleActivityTask, attributes: Some(ScheduleActivityTaskCommandAttributes(ScheduleActivityTaskCommandAttributes { activity_id: "1", activity_type: Some(ActivityType { name: "greet" }), namespace: "", task_queue: Some(TaskQueue { name: "instrumentation", kind: Normal }), header: Some(Header { fields: {} }), input: Some(Payloads { payloads: [Payload { metadata: {"encoding": [106, 115, 111, 110, 47, 112, 108, 97, 105, 110]}, data: [34, 84, 101, 109, 112, 111, 114, 97, 108, 34] }] }), schedule_to_close_timeout: None, schedule_to_start_timeout: None, start_to_close_timeout: Some(Duration { seconds: 300, nanos: 0 }), heartbeat_timeout: None, retry_policy: None })) }]
2021-11-24T15:53:45.467Z [activity] info: Log from activity { name: 'Temporal' }
2021-11-24T15:53:45.468Z [activity] debug: activity completed {
  activity: {
    taskToken: Uint8Array(116) [
       10,  36, 100,  51, 101, 101,  55, 102,  52, 102,  45,  51,
       51,  98,  56,  45,  52,  56,  57,  52,  45,  97,  48,  51,
       48,  45,  56, 101,  48,  57, 101,  52,  53,  52,  49,  50,
       97,  50,  18,  24, 105, 110, 115, 116, 114, 117, 109, 101,
      110, 116,  97, 116, 105, 111, 110,  45, 115,  97, 109, 112,
      108, 101,  45,  48,  26,  36,  97,  53,  98, 101,  52,  50,
       55,  99,  45,  99,  99,  52, 100,  45,  52, 102,  50,  56,
       45,  97,  52,  48,  55,  45,  51,  51,  99, 100,  97,  49,
       54, 100,  49,  97,
      ... 16 more items
    ],
    activityId: '1',
    workflowExecution: WorkflowExecution {
      workflowId: 'instrumentation-sample-0',
      runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7'
    },
    attempt: 1,
    isLocal: false,
    activityType: 'greet',
    workflowType: 'logSampleWorkflow',
    heartbeatDetails: undefined,
    activityNamespace: 'default',
    workflowNamespace: 'default',
    scheduledTimestampMs: 1637769225464,
    startToCloseTimeoutMs: 300000,
    scheduleToCloseTimeoutMs: 300001
  },
  durationMs: 0
}
2021-11-24T15:53:45.466Z [worker] debug: Got activity task {
  taskToken: 'CiRkM2VlN2Y0Zi0zM2I4LTQ4OTQtYTAzMC04ZTA5ZTQ1NDEyYTISGGluc3RydW1lbnRhdGlvbi1zYW1wbGUtMBokYTViZTQyN2MtY2M0ZC00ZjI4LWE0MDctMzNjZGExNmQxYWI3IAUoATIBMUIFZ3JlZXQ=',
  activityId: '1',
  start: Start {
    headerFields: {},
    input: [
      Payload {
        metadata: { encoding: [Uint8Array] },
        data: Uint8Array(10) [
           34,  84, 101, 109,
          112, 111, 114,  97,
          108,  34
        ]
      }
    ],
    heartbeatDetails: [],
    workflowNamespace: 'default',
    workflowType: 'logSampleWorkflow',
    workflowExecution: WorkflowExecution {
      workflowId: 'instrumentation-sample-0',
      runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7'
    },
    activityType: 'greet',
    scheduledTime: Timestamp {
      seconds: Long { low: 1637769225, high: 0, unsigned: false },
      nanos: 464290000
    },
    currentAttemptScheduledTime: Timestamp {
      seconds: Long { low: 1637769225, high: 0, unsigned: false },
      nanos: 464290000
    },
    startedTime: Timestamp {
      seconds: Long { low: 1637769225, high: 0, unsigned: false },
      nanos: 465318000
    },
    attempt: 1,
    scheduleToCloseTimeout: Duration {
      seconds: Long { low: 300, high: 0, unsigned: false },
      nanos: 1028000
    },
    startToCloseTimeout: Duration { seconds: Long { low: 300, high: 0, unsigned: false } },
    heartbeatTimeout: Duration {}
  }
}
2021-11-24T15:53:45.466Z [worker] debug: [temporal_sdk_core] poll_activity_task; task_queue="instrumentation"
2021-11-24T15:53:45.467Z [worker] debug: Starting activity { activityId: '1', activityType: 'greet' }
2021-11-24T15:53:45.469Z [worker] debug: Activity resolved { activityId: '1', status: 'completed' }
2021-11-24T15:53:45.469Z [worker] debug: [temporal_sdk_core] complete_activity_task; completion=ActivityTaskCompletion { task_token: [10, 36, 100, 51, 101, 101, 55, 102, 52, 102, 45, 51, 51, 98, 56, 45, 52, 56, 57, 52, 45, 97, 48, 51, 48, 45, 56, 101, 48, 57, 101, 52, 53, 52, 49, 50, 97, 50, 18, 24, 105, 110, 115, 116, 114, 117, 109, 101, 110, 116, 97, 116, 105, 111, 110, 45, 115, 97, 109, 112, 108, 101, 45, 48, 26, 36, 97, 53, 98, 101, 52, 50, 55, 99, 45, 99, 99, 52, 100, 45, 52, 102, 50, 56, 45, 97, 52, 48, 55, 45, 51, 51, 99, 100, 97, 49, 54, 100, 49, 97, 98, 55, 32, 5, 40, 1, 50, 1, 49, 66, 5, 103, 114, 101, 101, 116], task_queue: "instrumentation", result: Some(ActivityResult { status: Some(Completed(Success { result: Some(Payload { metadata: {"encoding": [106, 115, 111, 110, 47, 112, 108, 97, 105, 110]}, data: [34, 72, 101, 108, 108, 111, 44, 32, 84, 101, 109, 112, 111, 114, 97, 108, 33, 34] }) })) }) }
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::workflow::workflow_tasks] Applying new workflow task from server task_token=CiRkM2VlN2Y0Zi0zM2I4LTQ4OTQtYTAzMC04ZTA5ZTQ1NDEyYTISGGluc3RydW1lbnRhdGlvbi1zYW1wbGUtMBokYTViZTQyN2MtY2M0ZC00ZjI4LWE0MDctMzNjZGExNmQxYWI3IAgoAQ== history_length=6
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::workflow::workflow_tasks::concurrency_manager] create_or_update machines; run_id=a5be427c-cc4d-4f28-a407-33cda16d1ab7
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] handling event event=HistoryEvent(id: 4, Some(WorkflowTaskCompleted)) machine_name=WorkflowTaskMachine state=Started
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] Machine produced commands commands=[WFTaskStartedTrigger] state=Completed machine_name=WorkflowTaskMachine
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] Machine produced responses responses=[TriggerWFTaskStarted] machine_name=WorkflowTask
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] handling event event=HistoryEvent(id: 5, Some(ActivityTaskScheduled)) machine_name=ActivityMachine state=ScheduleCommandCreated
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] handling event event=HistoryEvent(id: 6, Some(ActivityTaskStarted)) machine_name=ActivityMachine state=ScheduledEventRecorded
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] handling event event=HistoryEvent(id: 7, Some(ActivityTaskCompleted)) machine_name=ActivityMachine state=Started
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] Machine produced commands commands=[Complete] state=Completed machine_name=ActivityMachine
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] Machine produced responses responses=[PushWFJob] machine_name=Activity
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] handling non-stateful event event=HistoryEvent(id: 8, Some(WorkflowTaskScheduled))
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] handling event event=HistoryEvent(id: 8, Some(WorkflowTaskScheduled)) machine_name=WorkflowTaskMachine state=Created
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] handling event event=HistoryEvent(id: 9, Some(WorkflowTaskStarted)) machine_name=WorkflowTaskMachine state=Scheduled
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines] Machine produced commands commands=[WFTaskStartedTrigger] state=Started machine_name=WorkflowTaskMachine
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] Machine produced responses responses=[TriggerWFTaskStarted] machine_name=WorkflowTask
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core::worker] Sending activation to lang activation=WfActivation(run_id: a5be427c-cc4d-4f28-a407-33cda16d1ab7, is_replaying: false, jobs: ResolveActivity)
null [worker] debug: Got workflow activation {
  runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7',
  jobs: [
    WFActivationJob {
      resolveActivity: ResolveActivity {
        seq: 1,
        result: ActivityResult { completed: [Success] }
      }
    }
  ]
}
2021-11-24T15:53:45.471Z [worker] debug: [temporal_sdk_core] poll_workflow_activation; task_queue="instrumentation"
2021-11-24T15:53:45.473Z [worker] debug: Completed activation { runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7' }
2021-11-24T15:53:45.474Z [workflow] info: Greeted {
  workflowType: 'logSampleWorkflow',
  runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7',
  workflowId: 'instrumentation-sample-0',
  namespace: 'default',
  taskQueue: 'instrumentation',
  isReplaying: false,
  greeting: 'Hello, Temporal!'
}
2021-11-24T15:53:45.474Z [workflow] debug: workflow completed {
  workflowType: 'logSampleWorkflow',
  runId: 'a5be427c-cc4d-4f28-a407-33cda16d1ab7',
  workflowId: 'instrumentation-sample-0',
  namespace: 'default',
  taskQueue: 'instrumentation',
  isReplaying: false,
  durationMs: 39
}
2021-11-24T15:53:45.474Z [worker] debug: [temporal_sdk_core] complete_workflow_activation; completion=WfActivationCompletion(run_id: a5be427c-cc4d-4f28-a407-33cda16d1ab7, status: Success(CompleteWorkflowExecution )) run_id=a5be427c-cc4d-4f28-a407-33cda16d1ab7
2021-11-24T15:53:45.474Z [worker] debug: [temporal_sdk_core::workflow::bridge] wf bridge iteration fetch in_cmds=[CompleteWorkflow(CompleteWorkflowExecution { result: Some(Payload { metadata: {"encoding": [98, 105, 110, 97, 114, 121, 47, 110, 117, 108, 108]}, data: [] }) })]
2021-11-24T15:53:45.474Z [worker] debug: [temporal_sdk_core::machines] handling command command_type=CompleteWorkflowExecution machine_name=CompleteWorkflowMachine state=CompleteWorkflowCommandCreated
2021-11-24T15:53:45.474Z [worker] debug: [temporal_sdk_core::machines::workflow_machines] prepared commands commands=[Cmd&Machine(CompleteWorkflowExecution)]
2021-11-24T15:53:45.474Z [worker] debug: [temporal_sdk_core::worker] Sending commands to server: [Command { command_type: CompleteWorkflowExecution, attributes: Some(CompleteWorkflowExecutionCommandAttributes(CompleteWorkflowExecutionCommandAttributes { result: Some(Payloads { payloads: [Payload { metadata: {"encoding": [98, 105, 110, 97, 114, 121, 47, 110, 117, 108, 108]}, data: [] }] }) })) }]
```

</details>
