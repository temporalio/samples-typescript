import { AsyncLocalStorage } from 'async_hooks';
import { PropagatedContext } from './context-type';

const contextStorage: AsyncLocalStorage<PropagatedContext> = new AsyncLocalStorage();

export function withContext<Ret>(
  extraContext: PropagatedContext | undefined,
  fn: (context: PropagatedContext) => Ret
): Ret {
  if (!extraContext) return fn(getContext());
  const newContext = { ...contextStorage.getStore(), ...extraContext };
  return contextStorage.run(newContext, () => fn(newContext));
}

export function getContext(): PropagatedContext {
  return contextStorage.getStore() ?? {};
}
