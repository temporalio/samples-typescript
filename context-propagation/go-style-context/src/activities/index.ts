import { GoStyleContext } from '../context/context-type';

export async function greet(ctx: GoStyleContext, name: string): Promise<string> {
  ctx.info(`Log from activity with customer ${ctx.customer ?? 'unknown'}`, {
    name,
  });
  return `Hello, ${name}!`;
}
