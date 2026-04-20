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

export async function timeoutOrUserAction(timeout: Duration): Promise<ExpenseStatus> {
  let status: ExpenseStatus = ExpenseStatus.TIMED_OUT;
  wf.setHandler(approveSignal, () => { status = ExpenseStatus.APPROVED; });
  wf.setHandler(rejectSignal, () => { status = ExpenseStatus.REJECTED; });
  await wf.condition(() => status !== ExpenseStatus.TIMED_OUT, timeout);

  return status;
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
