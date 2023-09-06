import * as wf from '@temporalio/workflow';
import type { Duration } from '@temporalio/common';
import type * as activities from './activities';

export enum ExpenseStatus {
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TIMED_OUT = 'TIMED_OUT',
  COMPLETED = 'COMPLETED',
}

export const approveSignal = wf.defineSignal('approve');
export const rejectSignal = wf.defineSignal('reject');

const { createExpense, payment } = wf.proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export function timeoutOrUserAction(timeout: Duration): Promise<ExpenseStatus> {
  return new Promise((resolve, reject) => {
    wf.setHandler(approveSignal, () => resolve(ExpenseStatus.APPROVED));
    wf.setHandler(rejectSignal, () => resolve(ExpenseStatus.REJECTED));
    wf.sleep(timeout).then(() => resolve(ExpenseStatus.TIMED_OUT), reject);
  });
}

export async function expense(expenseId: string, timeout: Duration = '10s'): Promise<{ status: ExpenseStatus }> {
  await createExpense(expenseId);
  const status = await timeoutOrUserAction(timeout);
  if (status !== ExpenseStatus.APPROVED) {
    return { status };
  }
  await payment(expenseId);
  return { status: ExpenseStatus.COMPLETED };
}
