import { Connection } from '@temporalio/client';
import { defaultPayloadConverter } from '@temporalio/common';
import { nanoid } from 'nanoid';

async function run() {
  const workflowId = 'workflow-' + nanoid();
  const requestId = 'request-' + nanoid();
  // @@@SNIPSTART typescript-grpc-call-basic
  const connection = new Connection();

  // // normal way of starting a Workflow, with a WorkflowClient
  // const client = new WorkflowClient(connection.service);
  // await client.start(/* etc */);

  const payload = defaultPayloadConverter.toPayload('Temporal');
  if (payload == null) {
    // This should not happen with standard inputs and the defaultPayloadConverter.
    throw new TypeError('Could not convert string to payload');
  }
  // equivalent grpc call to client.start()
  await connection.service.startWorkflowExecution({
    namespace: 'default',
    workflowId,
    requestId,
    taskQueue: { name: 'grpc-calls' },
    workflowType: { name: 'example' },
    input: {
      // WorkflowClient passes data through Data Converter to convert to Payloads; with gRPC calls have to do it yourself
      // import { defaultPayloadConverter, toPayloads } from '@temporalio/common';
      payloads: [payload],
    },
  });
  // @@@SNIPEND

  await sleep();

  // @@@SNIPSTART typescript-grpc-call-getWorkflowExecutionHistory
  // no equivalent call in client, this is only available as an SDK call
  const res = await connection.service.getWorkflowExecutionHistory({
    execution: { workflowId },
    namespace: 'default',
  });
  console.log(res.history);
  // @@@SNIPEND

  await sleep();

  // @@@SNIPSTART typescript-grpc-call-listWorkflowExecutions
  // no equivalent call in client, this is only available as an SDK call
  // requires ElasticSearch
  const results = await connection.service.listWorkflowExecutions({
    namespace: 'default',
  });
  console.table(results.executions);
  // @@@SNIPEND
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function sleep() {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
