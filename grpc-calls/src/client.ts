import { Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { defaultPayloadConverter } from '@temporalio/common';
import { nanoid } from 'nanoid';
import { setTimeout } from 'timers/promises';

async function run() {
  const workflowId = 'workflow-' + nanoid();
  const requestId = 'request-' + nanoid();
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);

  // // normal way of starting a Workflow, with a Client
  // const client = new Client({ connection });
  // await client.workflow.start(/* etc */);

  const payload = defaultPayloadConverter.toPayload('Temporal');
  if (payload == null) {
    // This should not happen with standard inputs and the defaultPayloadConverter.
    throw new TypeError('Could not convert string to payload');
  }
  // equivalent grpc call to client.workflow.start()
  await connection.workflowService.startWorkflowExecution({
    namespace: 'default',
    workflowId,
    requestId,
    taskQueue: { name: 'grpc-calls' },
    workflowType: { name: 'example' },
    input: {
      // Client passes data through Data Converter to convert to Payloads; with gRPC calls have to do it yourself
      // import { defaultPayloadConverter, toPayloads } from '@temporalio/common';
      payloads: [payload],
    },
  });

  await setTimeout(1000);

  // equivalent grpc call to handle.fetchHistory()
  const res = await connection.workflowService.getWorkflowExecutionHistory({
    execution: { workflowId },
    namespace: 'default',
  });
  console.log(res.history);

  await setTimeout(1000);

  // equivalent grpc call to client.workflow.list()
  const results = await connection.workflowService.listWorkflowExecutions({
    namespace: 'default',
  });
  console.table(results.executions);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
