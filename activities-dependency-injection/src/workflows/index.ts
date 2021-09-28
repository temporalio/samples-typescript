import { createActivityHandle } from '@temporalio/workflow';
import { Example } from '../interfaces';

// @@@SNIPSTART typescript-activity-deps-workflow
import type { createActivities } from '../activities';

// note usage of ReturnType<> generic since createActivities is a factory function
const { greet, greet_es } = createActivityHandle<ReturnType<typeof createActivities>>({
  scheduleToCloseTimeout: '30 seconds',
});
// @@@SNIPEND

export const dependencyWF: Example = () => ({
  async execute(): Promise<string> {
    const english = await greet('Hello');
    const spanish = await greet_es('Hola');
    return `${english}\n${spanish}`
  },
});