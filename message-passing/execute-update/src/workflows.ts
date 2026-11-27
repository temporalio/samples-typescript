// @@@SNIPSTART typescript-update-workflow
import * as wf from '@temporalio/workflow';

type FetchAndAddInput = { amount: number };
type FetchAndAddResult = { previousCount: number };
type CounterResult = { count: number };

// Define an update that takes an amount and returns the previous count.
export const fetchAndAdd = wf.defineUpdate<FetchAndAddResult, [FetchAndAddInput]>('fetchAndAdd');
// Define a second update that we will use to complete the workflow.
export const done = wf.defineUpdate('done');

export async function counter(): Promise<CounterResult> {
  let count = 0;
  let shouldComplete = false;

  // Define an update validator that rejects negative inputs to the update.
  const validator = ({ amount }: FetchAndAddInput) => {
    if (amount < 0) {
      throw new Error('Argument must not be negative');
    }
  };

  // Define the update handler implementing the fetchAndAdd operation. Note that
  // an update can mutate workflow state, and return a value.
  const handler = ({ amount }: FetchAndAddInput): FetchAndAddResult => {
    const previousCount = count;
    count += amount;
    return { previousCount };
  };

  // Register the handler and validator for the 'fetchAndAdd' update.
  wf.setHandler(fetchAndAdd, handler, { validator });

  // Register the handler for the 'done' update.
  wf.setHandler(done, () => {
    shouldComplete = true;
  });

  // The shouldComplete flag is initially false. Here, the workflow waits
  // indefinitely until it becomes true. When a client sends the 'done' update,
  // the workflow will advance beyond this line and return.
  await wf.condition(() => shouldComplete);

  return { count };
}
// @@@SNIPEND
