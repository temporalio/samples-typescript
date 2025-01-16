import * as wf from '@temporalio/workflow';
import { getTransactionConfirmation, TransactionReport } from './shared';

export async function transactionWorkflow(): Promise<TransactionReport> {
  let confirmed = false;
  wf.setHandler(getTransactionConfirmation, async () => {
    await wf.condition(() => confirmed);
    const status = 'confirmed' as const;
    return { status };
  });
  confirmed = true;
  // Simulate lengthy transaction completion
  await wf.sleep(2000);
  return { finalAmount: 77, status: 'complete' };
}
