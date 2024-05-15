import { OneClickBuy } from '../../temporal/lib/workflows.js';
import { getTemporalClient } from '../../temporal/lib/client.js';

export default async function startBuy(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }

  const { itemId, transactionId } = req.body;
  if (!itemId) {
    res.status(405).send({ message: 'must send itemId to buy' });
    return;
  }
  // kick off the purchase async
  await getTemporalClient().workflow.start(OneClickBuy, {
    taskQueue: 'ecommerce-oneclick',
    workflowId: transactionId,
    args: [itemId],
  });

  res.status(200).json({ ok: true });
}
