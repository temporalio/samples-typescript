import { getTemporalClient } from '../../temporal/lib/client.js';

export default async function cancelBuy(req, res) {
  const { id } = req.query;
  if (!id) {
    res.status(405).send({ message: 'must send workflow id to cancel' });
    return;
  }

  const workflow = await getTemporalClient().workflow.getHandle(id);
  try {
    await workflow.signal('cancelPurchase');
    res.status(200).json({ cancelled: id });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: e.details, errorCode: e.code });
    return;
  }
}
