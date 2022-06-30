import { upsertSearchAttributes, workflowInfo } from '@temporalio/workflow';

// @@@SNIPSTART typescript-search-attributes-workflow
export async function example(): Promise<string> {
  const customInt = (workflowInfo().searchAttributes?.CustomIntField[0] as number) || 0;
  upsertSearchAttributes({
    // overwrite the existing value
    CustomIntField: [customInt + 1],
    // add a new value
    CustomDoubleField: [3.14],
  });
  return 'done';
}
// @@@SNIPEND
