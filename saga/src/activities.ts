import { BoundedContextClients } from './clients';

// createActivities just returns client implementations directly right now, but later might decorate
export function createActivities(clients: BoundedContextClients) {
  return {
    createAccount: clients.accounts.createAccount.bind(clients.accounts),

    addBankAccount: clients.banking.addBankAccount.bind(clients.banking),
    disconnectBankAccounts: clients.banking.disconnectBankAccounts.bind(clients.banking),

    addClient: clients.clients.addClient.bind(clients.clients),
    removeClient: clients.clients.removeClient.bind(clients.clients),

    addAddress: clients.postOffice.addAddress.bind(clients.postOffice),
    clearPostalAddresses: clients.postOffice.clearPostalAddresses.bind(clients.postOffice),
  };
}
