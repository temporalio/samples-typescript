import { BankDetails, PostalAddress } from './values';

// Workflows Commands are top-level ApplicationService
// Connecting clients execute these user stories with these commands
export namespace Workflows {
  export interface OpenAccount {
    accountId: string;
    bankId: string;
    clientEmail: string;
    address: PostalAddress;
    bankDetails: BankDetails;
  }
}
// Commands are API for each BoundedContext
// presumably these are talking to a DomainService in each context
export namespace Commands {
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
}
