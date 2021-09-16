import { Expense, ExpenseStatus } from './interfaces';
import { Trigger, sleep } from '@temporalio/workflow';
import { createActivityHandle } from '@temporalio/workflow';
import type * as activities from './activities';

const { createExpense, payment } = createActivityHandle<typeof activities>({
  scheduleToCloseTimeout: '5 minutes',
});

const defaultTimeoutMS = 10000;

export const expense: Expense = function(expenseId: string, timeoutMS = defaultTimeoutMS) {
  let status: ExpenseStatus = ExpenseStatus.CREATED;

  const signalTrigger = new Trigger<ExpenseStatus.APPROVED | ExpenseStatus.REJECTED>();

  return {
    async execute(): Promise<{ status: ExpenseStatus }> {
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
    },
    signals: {
      approve() {
        signalTrigger.resolve(ExpenseStatus.APPROVED);
      },
      reject() {
        signalTrigger.resolve(ExpenseStatus.REJECTED);
      }
    }
  };
};