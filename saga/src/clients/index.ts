import { Accounts, Banking, BoundedContextClients, Clients, PostOffice } from '../types/clients';
import { Commands } from '../types/commands';

class ClientsServiceClient implements Clients.Client {
  async removeClient(params: Commands.RemoveClient): Promise<void> {
    console.log('REMOVING CLIENT', params);
  }

  async addClient(params: Commands.AddClient): Promise<void> {
    if (params.shouldThrow) {
      throw new Error(params.shouldThrow);
    }
    console.log('ADDING CLIENT', params);
  }
}
class AccountsClient implements Accounts.Client {
  async createAccount(params: Commands.CreateAccount): Promise<void> {
    if (params.shouldThrow) {
      throw new Error(params.shouldThrow);
    }
    console.log('CREATING ACCOUNT', params);
  }
}
class BankingClient implements Banking.Client {
  async addBankAccount(params: Commands.AddBankAccount): Promise<void> {
    if (params.shouldThrow) {
      throw new Error(params.shouldThrow);
    }
    console.log('ADDING BANK ACCOUNT', params);
  }

  async disconnectBankAccounts(params: Commands.DisconnectBankAccounts): Promise<void> {
    console.log('DISCONNECT BANK ACCOUNTS', params);
  }
}
class PostOfficeClient implements PostOffice.Client {
  async addAddress(params: Commands.AddPostalAddress): Promise<void> {
    if (params.shouldThrow) {
      throw new Error(params.shouldThrow);
    }
    console.log('ADDING ADDRESS', params);
  }

  async clearPostalAddresses(params: Commands.ClearPostalAddresses): Promise<void> {
    console.log('CLEARING ADDRESSES', params);
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
