import * as Commands from './commands';

export interface Client {
  addBankAccount(params: Commands.AddBankAccount): Promise<void>;
  disconnectBankAccounts(params: Commands.DisconnectBankAccounts): Promise<void>;
}
