import * as Commands from './commands';

export interface Client {
  addClient(params: Commands.AddClient): Promise<void>;
  removeClient(params: Commands.RemoveClient): Promise<void>;
}
