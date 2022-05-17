import { BoundedContextClients } from './types/clients';

// createActivities just returns client implementations directly right now, but later might decorate
export function createActivities(clients: BoundedContextClients) {
  return {
    createAccount: clients.accounts.createAccount,

    addBankAccount: clients.banking.addBankAccount,
    disconnectBankAccounts: clients.banking.disconnectBankAccounts,

    addClient: clients.clients.addClient,
    removeClient: clients.clients.removeClient,

    addAddress: clients.postOffice.addAddress,
    clearPostalAddresses: clients.postOffice.clearPostalAddresses,
  };
}
