import { createExpense } from '@activities/createExpense';
import { payment } from '@activities/payment' ;
import { sleep } from '@temporalio/workflow';

let complete: Function | null = null;
let status = 'CREATED';
const timeoutMS = 10000;

const signals = {
  approve() {
    status = 'APPROVED';
    if(complete != null) {
      complete();
    }
  },
  reject() {
    status = 'REJECTED';
    if(complete != null) {
      complete();
    }
  }
}

async function main(expenseId: string): Promise<{ status: string }> {
  await createExpense(expenseId);

  if (status === 'CREATED') {
    const worker = new Promise((resolve) => {
      complete = resolve;
    });

    await Promise.race([worker, sleep(timeoutMS)]);
  }

  if (status !== 'APPROVED') {
    return { status };
  }

  await payment(expenseId);

  return { status: 'COMPLETED' };
}
exports.workflow = { main, signals };