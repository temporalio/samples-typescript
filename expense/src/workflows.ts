import * as wf from '@temporalio/workflow';
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

const { createExpense, payment } = wf.createActivityHandle<typeof activities>({
  scheduleToCloseTimeout: '5 minutes',
});

export function timeoutOrUserAction(timeout: string): Promise<ExpenseStatus> {
  return new Promise((resolve, reject) => {
    wf.setListener(approveSignal, () => resolve(ExpenseStatus.APPROVED));
    wf.setListener(rejectSignal, () => resolve(ExpenseStatus.REJECTED));
    wf.sleep(timeout).then(() => resolve(ExpenseStatus.TIMED_OUT), reject);
  });
}

export async function expense(expenseId: string, timeout = '10s'): Promise<{ status: ExpenseStatus }> {
  await createExpense(expenseId);
  const status = await timeoutOrUserAction(timeout);
  if (status !== ExpenseStatus.APPROVED) {
    return { status };
  }
  await payment(expenseId);
  return { status: ExpenseStatus.COMPLETED };
}
