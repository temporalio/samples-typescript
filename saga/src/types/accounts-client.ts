import * as Commands from './commands';

export interface Client {
  createAccount(params: Commands.CreateAccount): Promise<void>;
}
