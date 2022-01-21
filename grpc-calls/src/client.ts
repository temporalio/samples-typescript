// @@@SNIPSTART typescript-grpc-call-basic
import { Connection } from '@temporalio/client';
import { defaultDataConverter } from '@temporalio/common';

async function run() {
  const connection = new Connection();

  // // normal way of starting a Workflow, with a WorkflowClient
  // const client = new WorkflowClient(connection.service);
  // await client.start(/* etc */);

  // equivalent grpc call to client.start()
  const workflowId = 'wf-id-' + Math.floor(Math.random() * 1000);
  await connection.service.startWorkflowExecution({
    namespace: 'default',
    workflowId,
    requestId: 'request-id-' + Math.floor(Math.random() * 1000),
    taskQueue: { name: 'tutorial' },
    workflowType: { name: 'example' },
    input: { payloads: await defaultDataConverter.toPayloads('Temporal') },
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
