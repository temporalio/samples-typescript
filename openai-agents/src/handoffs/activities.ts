type LookupAccountInput = { accountId: string };
type LookupAccountResult = { accountId: string; status: string; plan: string };

export async function lookupAccount(input: LookupAccountInput): Promise<LookupAccountResult> {
  return { accountId: input.accountId, status: 'active', plan: 'pro' };
}
