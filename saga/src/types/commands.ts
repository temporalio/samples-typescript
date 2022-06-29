import { BankDetails, PostalAddress } from './values';

// Commands are API for each BoundedContext
// presumably these are talking to a DomainService in each context
export interface CreateAccount {
  accountId: string;
  shouldThrow?: string;
}
export interface AddClient {
  accountId: string;
  clientEmail: string;
  shouldThrow?: string;
}
export interface RemoveClient {
  accountId: string;
}
export interface AddBankAccount {
  accountId: string;
  details: BankDetails;
  shouldThrow?: string;
}
export interface DisconnectBankAccounts {
  accountId: string;
}
export interface AddPostalAddress {
  accountId: string;
  address: PostalAddress;
  shouldThrow?: string;
}
export interface ClearPostalAddresses {
  accountId: string;
}
