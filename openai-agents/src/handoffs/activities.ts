export async function lookupAccount(input: { accountId: string }): Promise<string> {
  return JSON.stringify({ accountId: input.accountId, status: 'active', plan: 'pro' });
}
