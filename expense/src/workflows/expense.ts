import { createExpense } from '@activities/createExpense';
import { payment } from '@activities/payment' ;
import { Trigger, sleep } from '@temporalio/workflow';

type expenseStatus = 'CREATED' | 'APPROVED' | 'REJECTED' | 'TIMED_OUT' | 'COMPLETED';
let status: expenseStatus = 'CREATED';

const signalTrigger = new Trigger<void>();
const timeoutMS = 10000;

const signals = {
  approve() {
    status = 'APPROVED';
    signalTrigger.resolve();
  },
  reject() {
    status = 'REJECTED';
    signalTrigger.resolve();
  }
}

async function main(expenseId: string): Promise<{ status: string }> {
  await createExpense(expenseId);

  if (status === 'CREATED') {
    await Promise.race([signalTrigger, sleep(timeoutMS)]);
  }

  if (status === 'CREATED') {
    status = 'TIMED_OUT';
    return { status };
  }

  if (status === 'REJECTED') {
    return { status };
  }

  await payment(expenseId);
  status = 'COMPLETED';

  return { status };
}
exports.workflow = { main, signals };