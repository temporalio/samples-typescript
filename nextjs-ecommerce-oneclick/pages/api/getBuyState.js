import { WorkflowClient } from '@temporalio/client';

export default async function queryState(req, res) {
  const { id } = req.query;
  if (!id) {
    res.status(405).send({ message: 'must send workflow id to query' });
    return;
  }

  const client = new WorkflowClient();
  console.log({ id });
  const workflow = client.getHandle(id);
  try {
    const purchaseState = await workflow.query('purchaseState');
    res.status(200).json({ purchaseState });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: e.details, errorCode: e.code });
    return;
  }
}
