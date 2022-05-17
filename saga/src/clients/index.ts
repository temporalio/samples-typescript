import { Accounts, Banking, BoundedContextClients, Clients, PostOffice } from '../types/clients';
import { Commands } from '../types/commands';

class ClientsServiceClient implements Clients.Client {
  removeClient(params: Commands.RemoveClient): Promise<void> {
    console.log('REMOVING CLIENT', params);
    return Promise.resolve(undefined);
  }

  addClient(params: Commands.AddClient): Promise<void> {
    if (params.shouldThrow) {
      throw new Error(params.shouldThrow);
    }
    console.log('ADDING CLIENT', params);
    return Promise.resolve(undefined);
  }
}
class AccountsClient implements Accounts.Client {
  createAccount(params: Commands.CreateAccount): Promise<void> {
    if (params.shouldThrow) {
      throw new Error(params.shouldThrow);
    }
    console.log('CREATING ACCOUNT', params);
    return Promise.resolve(undefined);
  }
}
class BankingClient implements Banking.Client {
  addBankAccount(params: Commands.AddBankAccount): Promise<void> {
    if (params.shouldThrow) {
      throw new Error(params.shouldThrow);
    }
    console.log('ADDING BANK ACCOUNT', params);
    return Promise.resolve(undefined);
  }

  disconnectBankAccounts(params: Commands.DisconnectBankAccounts): Promise<void> {
    console.log('DISCONNECT BANK ACCOUNTS', params);
    return Promise.resolve(undefined);
  }
}
class PostOfficeClient implements PostOffice.Client {
  addAddress(params: Commands.AddPostalAddress): Promise<void> {
    if (params.shouldThrow) {
      throw new Error(params.shouldThrow);
    }
    console.log('ADDING ADDRESS', params);
    return Promise.resolve(undefined);
  }

  clearPostalAddresses(params: Commands.ClearPostalAddresses): Promise<void> {
    console.log('CLEARING ADDRESSES', params);
    return Promise.resolve(undefined);
  }
}
export const createClients = async (): Promise<BoundedContextClients> => {
  return {
    accounts: new AccountsClient(),
    banking: new BankingClient(),
    clients: new ClientsServiceClient(),
    postOffice: new PostOfficeClient(),
  };
};
