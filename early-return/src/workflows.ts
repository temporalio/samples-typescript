import * as wf from '@temporalio/workflow';
import { getTransactionConfirmation, TransactionReport } from './shared';

export async function transactionWorkflow(id: string): Promise<TransactionReport> {
  let confirmed = false;
  wf.setHandler(getTransactionConfirmation, async () => {
    await wf.condition(() => confirmed);
    const status = 'confirmed' as const;
    return { id, status };
  });
  await wf.sleep(1000);
  confirmed = true;
  let amount = 77;
  return { id, finalAmount: amount, status: 'complete' };
}
