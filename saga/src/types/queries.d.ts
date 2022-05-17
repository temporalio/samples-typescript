import { PostalAddress } from './values';

export namespace Views {
  export interface AccountParams {
    accountId: string;
  }
  export interface OpenedAccount {
    accountId: string;
    clientEmail: string;
    address: PostalAddress;
  }
}
export interface Queries {
  openedAccount(params: Views.AccountParams): Promise<Views.OpenedAccount>;
}
