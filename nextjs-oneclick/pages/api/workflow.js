import { Connection, WorkflowClient } from '@temporalio/client';
import { OneClickBuy } from '../../temporal/lib/workflows';

export default async function helloAPI(req, res) {
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = new Connection();
  // Workflows will be started in the "default" namespace unless specified otherwise
  // via options passed the WorkflowClient constructor.
  const client = new WorkflowClient(connection.service);
  // Create a typed handle for the OneClickBuy Workflow.
  const workflow = client.createWorkflowHandle(OneClickBuy, { taskQueue: 'tutorial' });
  const runId = await workflow.start('Temporal');
  console.log('0', runId);
  console.log('1', await workflow.query.purchaseState())
  await workflow.signal.cancelPurchase("hi")
  console.log('2', await workflow.query.purchaseState())

  res.status(200).json({ result: 'runid: ' + runId }) // Hello, Temporal!
}
