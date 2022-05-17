import { Commands } from './commands';

export interface BoundedContextClients {
  accounts: Accounts.Client;
  banking: Banking.Client;
  clients: Clients.Client;
  postOffice: PostOffice.Client;
}
export namespace Clients {
  import RemoveClient = Commands.RemoveClient;
  import AddClient = Commands.AddClient;

  export interface Client {
    addClient(params: AddClient): Promise<void>;
    removeClient(params: RemoveClient): Promise<void>;
  }
}
export namespace Accounts {
  import CreateAccount = Commands.CreateAccount;

  export interface Client {
    createAccount(params: CreateAccount): Promise<void>;
  }
}
export namespace Banking {
  import AddBankAccount = Commands.AddBankAccount;
  import DisconnectBankAccounts = Commands.DisconnectBankAccounts;

  export interface Client {
    addBankAccount(params: AddBankAccount): Promise<void>;
    disconnectBankAccounts(params: DisconnectBankAccounts): Promise<void>;
  }
}
export namespace PostOffice {
  import AddPostalAddress = Commands.AddPostalAddress;
  import ClearPostalAddresses = Commands.ClearPostalAddresses;

  export interface Client {
    addAddress(params: AddPostalAddress): Promise<void>;
    clearPostalAddresses(params: ClearPostalAddresses): Promise<void>;
  }
}
