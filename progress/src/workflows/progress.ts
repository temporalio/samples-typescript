import { Progress } from '../interfaces/workflows';
import { sleep }  from '@temporalio/workflow';

let progress = 0;

async function main() {
  for (let i = 0; i < 10; ++i) {
    progress += 10;
    await sleep(10);
  }

  return progress;
}

export const workflow: Progress = {
  main,
  queries: {
    getProgress: () => progress
  }
};