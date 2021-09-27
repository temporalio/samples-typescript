import { Connection, WorkflowClient } from '@temporalio/client';
import { OneClickBuy } from '../../temporal/lib/workflows/index.js';

export default async function startBuy(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' })
    return
  }

  const { itemId } = req.body
  if (!itemId) {
    res.status(405).send({ message: 'must send itemId to buy' })
    return
  }
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = new Connection();
  // Workflows will be started in the "default" namespace unless specified otherwise
  // via options passed the WorkflowClient constructor.
  const client = new WorkflowClient(connection.service);
  const handle = client.createWorkflowHandle(OneClickBuy, { taskQueue: 'tutorial' });
  await handle.start(itemId); // kick off the purchase async

  res.status(200).json({ workflowId: handle.workflowId }) // Hello, Temporal!
}
