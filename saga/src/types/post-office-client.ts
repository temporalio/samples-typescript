import * as Commands from './commands';
import AddPostalAddress = Commands.AddPostalAddress;
import ClearPostalAddresses = Commands.ClearPostalAddresses;

export interface Client {
  addAddress(params: AddPostalAddress): Promise<void>;
  clearPostalAddresses(params: ClearPostalAddresses): Promise<void>;
}
