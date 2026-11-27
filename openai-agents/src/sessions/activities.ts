type PingResult = { reply: string };

export async function ping(): Promise<PingResult> {
  return { reply: 'pong' };
}
