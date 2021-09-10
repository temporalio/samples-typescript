import { Expense, ExpenseStatus } from '../interfaces/workflows';
import { createExpense } from '@activities/createExpense';
import { payment } from '@activities/payment' ;
import { Trigger, sleep } from '@temporalio/workflow';

let status: ExpenseStatus = ExpenseStatus.CREATED;

const signalTrigger = new Trigger<ExpenseStatus.APPROVED | ExpenseStatus.REJECTED>();
const defaultTimeoutMS = 10000;

const signals = {
  approve() {
    signalTrigger.resolve(ExpenseStatus.APPROVED);
  },
  reject() {
    signalTrigger.resolve(ExpenseStatus.REJECTED);
  }
};

async function main(expenseId: string, timeoutMS = defaultTimeoutMS): Promise<{ status: ExpenseStatus }> {
  await createExpense(expenseId);

  if (status === ExpenseStatus.CREATED) {
    status = await Promise.race([
      signalTrigger,
      sleep(timeoutMS).then((): ExpenseStatus => ExpenseStatus.TIMED_OUT)
    ]);
  }

  if (status === ExpenseStatus.APPROVED) {
    await payment(expenseId);
    status = ExpenseStatus.COMPLETED;
  }

  return { status };
}
export const workflow: Expense = { main, signals };