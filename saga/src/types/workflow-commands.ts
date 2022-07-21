import { BankDetails, PostalAddress } from './values';

// Workflows Commands are top-level ApplicationService
// Connecting clients execute these user stories with these commands

export interface OpenAccount {
  accountId: string;
  bankId: string;
  clientEmail: string;
  address: PostalAddress;
  bankDetails: BankDetails;
}
