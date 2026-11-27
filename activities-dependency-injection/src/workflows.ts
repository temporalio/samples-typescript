import { proxyActivities } from '@temporalio/workflow';

// @@@SNIPSTART typescript-activity-deps-workflow
import type { createActivities } from './activities';

// Note usage of ReturnType<> generic since createActivities is a factory function
const { greet, greet_es } = proxyActivities<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '30 seconds',
});
// @@@SNIPEND

type DependencyWorkflowResult = { english: string; spanish: string };

export async function dependencyWF(): Promise<DependencyWorkflowResult> {
  const { greeting: english } = await greet({ msg: 'Hello' });
  const { greeting: spanish } = await greet_es({ mensaje: 'Hola' });
  return { english, spanish };
}
