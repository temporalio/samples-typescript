import wf from '@temporalio/workflow';
import { createActivityHandle } from '@temporalio/workflow';
import type * as activities from '../activities';

export enum ExpenseStatus {
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TIMED_OUT = 'TIMED_OUT',
  COMPLETED = 'COMPLETED',
}

const { createExpense, payment } = createActivityHandle<typeof activities>({
  scheduleToCloseTimeout: '5 minutes',
});

const defaultTimeoutMS = 10000;

export const approve = wf.defineSignal('approve');
export const reject = wf.defineSignal('reject');

export async function Expense(expenseId: string, timeoutMS = defaultTimeoutMS) {
  let status = ExpenseStatus.CREATED as ExpenseStatus;
  wf.setListener(approve, () => status = ExpenseStatus.APPROVED)
  wf.setListener(reject, () => status = ExpenseStatus.REJECTED)

  await createExpense(expenseId);
  if (await wf.condition(timeoutMS, () => status !== ExpenseStatus.CREATED)) {
    if (status === ExpenseStatus.APPROVED) {
      await payment(expenseId);
      status = ExpenseStatus.COMPLETED;
    }
  } else {
    status = ExpenseStatus.TIMED_OUT;
  }

  return { status };
};
