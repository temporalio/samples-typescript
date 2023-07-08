import { proxyActivities, ActivityFailure, ApplicationFailure, log } from '@temporalio/workflow';
import { createActivities } from './activities';
import * as Workflows from './types/workflow-commands';

import OpenAccount = Workflows.OpenAccount;

const defaultActivity = {
  startToCloseTimeout: '2s',
  scheduleToCloseTimeout: '3s',
} as const;
const longRunningActivity = {
  startToCloseTimeout: '4s',
  scheduleToCloseTimeout: '8s',
} as const;

// activityFunctions
const { addBankAccount } = proxyActivities<ReturnType<typeof createActivities>>(longRunningActivity);

const { createAccount, addClient, removeClient, addAddress, clearPostalAddresses, disconnectBankAccounts } =
  proxyActivities<ReturnType<typeof createActivities>>(defaultActivity);

interface Compensation {
  message: string;
  fn: () => Promise<void>;
}

// workflow implementations
// sequential executions
export async function openAccount(params: OpenAccount): Promise<void> {
  const compensations: Compensation[] = [];

  try {
    await createAccount({ accountId: params.accountId });
  } catch (err) {
    log.error('creating account failed. stopping.');
    // this is fatal so fails fast. no compensations are needed
    throw err;
  }

  try {
    // addAddress
    await addAddress({
      accountId: params.accountId,
      address: params.address,
    });
    // successfully called, so clear if a failure occurs later
    compensations.unshift({
      message: prettyErrorMessage('reversing add address'),
      fn: () => clearPostalAddresses({ accountId: params.accountId }),
    });

    // addClient
    await addClient({
      accountId: params.accountId,
      clientEmail: params.clientEmail,
    });
    // successfully called, so clear if a failure occurs later
    compensations.unshift({
      message: prettyErrorMessage('reversing add client'),
      fn: () => removeClient({ accountId: params.accountId }),
    });

    // addBankAccount
    await addBankAccount({
      accountId: params.accountId,
      details: params.bankDetails,
      shouldThrow: prettyErrorMessage('add bank account failed'),
    });
    // successfully called, so clear if a failure occurs later
    compensations.unshift({
      message: prettyErrorMessage('reversing add bank account'),
      fn: () => disconnectBankAccounts({ accountId: params.accountId }),
    });
  } catch (err) {
    if (err instanceof ActivityFailure && err.cause instanceof ApplicationFailure) {
      log.error(err.cause.message);
    } else {
      log.error(`error while opening account: ${err}`);
    }
    // an error occurred so call compensations
    await compensate(compensations);
    throw err;
  }
}

async function compensate(compensations: Compensation[] = []) {
  if (compensations.length > 0) {
    log.info('failures encountered during account opening - compensating');
    for (const comp of compensations) {
      try {
        log.error(comp.message);
        await comp.fn();
      } catch (err) {
        log.error(`failed to compensate: ${prettyErrorMessage('', err)}`);
        // swallow errors
      }
    }
  }
}

function prettyErrorMessage(message: string, err?: any) {
  let errMessage = err && err.message ? err.message : '';
  if (err && err instanceof ActivityFailure) {
    errMessage = `${err.cause?.message}`;
  }
  return `${message}: ${errMessage}`;
}
