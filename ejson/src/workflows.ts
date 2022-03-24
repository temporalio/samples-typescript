// @@@SNIPSTART typescript-ejson-workflow
import type { Result, User } from './types';

export async function example(user: User): Promise<Result> {
  const success =
    user.createdAt.getTime() < Date.now() &&
    user.hp > 50 &&
    user.matcher.test('Kaladin Stormblessed') &&
    user.token instanceof Uint8Array;
  return { success, at: new Date() };
}
// @@@SNIPEND
