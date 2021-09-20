import { createActivityHandle } from '@temporalio/workflow';
import type * as activities from './activities';
import { Example } from './interfaces';

const { greet } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '30 minutes',
});

export const example: Example = (name: string) => ({
  async execute(): Promise<string> {
    return await greet(name);
  },
});
