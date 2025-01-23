import * as wf from '@temporalio/workflow';
import { getTransactionConfirmation, TransactionReport } from './shared';

export async function transactionWorkflow(): Promise<TransactionReport> {
  let confirmed = false;
  wf.setHandler(getTransactionConfirmation, async () => {
    await wf.condition(() => confirmed);
    const status = 'confirmed' as const;
    return { status };
  });
  // Simulate low-latency operation required to initially confirm / authorize the transaction.
  await wf.sleep(500);
  confirmed = true;
  // Simulate slower transaction completion / payment capture process.
  await wf.sleep(5000);
  return { finalAmount: 77, status: 'complete' };
}
