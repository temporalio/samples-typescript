// @@@SNIPSTART nodejs-hello-workflow
import { Example } from '../interfaces/workflows';
import { Context } from '@temporalio/workflow';
import * as activities from '../activities';

const { greet } = Context.configureActivities<typeof activities>({
  type: 'remote',
  scheduleToCloseTimeout: '5 minutes',
});

// A workflow that simply calls an activity
async function main(name: string): Promise<string> {
  return greet(name);
}

// Declare the workflow's type to be checked by the Typescript compiler
export const workflow: Example = { main };
// @@@SNIPEND