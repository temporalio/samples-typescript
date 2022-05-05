import { proxyActivities, proxySinks, TemporalFailure, Sinks } from '@temporalio/workflow';
import { createActivities } from './activities';
import { Workflows } from '@typings/commands';

import OpenAccount = Workflows.OpenAccount;

const defaultActivity = {
  startToCloseTimeout: '2s',
  scheduleToCloseTimeout: '3s',
};
const longRunningActivity = {
  startToCloseTimeout: '4s',
  scheduleToCloseTimeout: '8s',
};

// activityFunctions
const { addBankAccount } = proxyActivities<ReturnType<typeof createActivities>>(longRunningActivity);

const { createAccount, addClient, removeClient, addAddress, clearPostalAddresses, disconnectBankAccounts } =
  proxyActivities<ReturnType<typeof createActivities>>(defaultActivity);

// utils
const { logger } = proxySinks<LoggerSinks>();

// interfaces
export interface LoggerSinks extends Sinks {
  logger: {
    info(message: string): void;
    err(message: string): void;
  };
}

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
    logger.err('creating account failed. stopping.');
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
      message: prettyErrorMessage('add postal address failed'),
      fn: () => clearPostalAddresses({ accountId: params.accountId }),
    });

    // addClient
    await addClient({
      accountId: params.accountId,
      clientEmail: params.clientEmail,
    });
    // successfully called, so clear if a failure occurs later
    compensations.unshift({
      message: prettyErrorMessage('add client failed'),
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
      message: prettyErrorMessage('add bank account failed'),
      fn: () => disconnectBankAccounts({ accountId: params.accountId }),
    });
  } catch (err) {
    // an error occurred so call compensations
    await compensate(compensations);
    throw err;
  }
}

async function compensate(compensations: Compensation[] = []) {
  if (compensations.length > 0) {
    logger.info('failures encountered during account opening - compensating');
    for (const comp of compensations) {
      try {
        logger.err(comp.message);
        await comp.fn();
      } catch (err) {
        logger.err(`failed to compensate: ${prettyErrorMessage('', err)}`);
        // swallow errors
      }
    }
  }
}

function prettyErrorMessage(message: string, err?: any) {
  let errMessage = '';
  if (err && err instanceof TemporalFailure) {
    errMessage = `${err.cause?.message}`;
  }
  if (err && err instanceof Error) errMessage = err.message;
  return `${message}: ${errMessage}`;
}
