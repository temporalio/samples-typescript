import { createActivityHandle } from '@temporalio/workflow';
import { Example } from '../interfaces';
// @@@SNIPSTART typescript-activity-deps-workflow
import type activities from '../activities';

const { greet } = createActivityHandle<ReturnType<typeof activities>>({
  scheduleToCloseTimeout: '30 seconds',
});
// @@@SNIPEND

export const example: Example = (name: string) => ({
  async execute(): Promise<string> {
    return await greet(name);
  },
});
