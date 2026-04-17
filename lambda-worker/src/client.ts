import { Connection, Client, WorkflowIdConflictPolicy } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { sampleWorkflow, TASK_QUEUE } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection, namespace: config.namespace });

  console.log('Connected to Temporal Service, starting workflow...');

  const result = await client.workflow.execute(sampleWorkflow, {
    taskQueue: TASK_QUEUE,
    args: ['Serverless Lambda Worker!'],
    workflowId: 'serverless-workflow-id-1',
    workflowIdConflictPolicy: WorkflowIdConflictPolicy.TERMINATE_EXISTING,
  });
  console.log(`Workflow result: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
