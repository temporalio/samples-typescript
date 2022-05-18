export interface PostalAddress {
  address1: string;
  address2?: string;
  postalCode: string;
}
export interface BankDetails {
  accountNumber: string;
  accountType: string;
  nickname?: string;
  personalOwner: Owner;
  routingNumber: string;
}
export interface Owner {
  firstName: string;
  lastName: string;
}
