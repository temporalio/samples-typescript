import { upsertSearchAttributes, workflowInfo } from '@temporalio/workflow';

// @@@SNIPSTART typescript-search-attributes-workflow
export async function example(): Promise<number> {
  const customInt = (workflowInfo().searchAttributes?.CustomIntField[0] as number) || 0;
  upsertSearchAttributes({
    // overwrite the existing CustomIntField: [2]
    CustomIntField: [customInt + 1],

    // delete the existing CustomBoolField: [true]
    CustomBoolField: [],

    // add a new value
    CustomDoubleField: [3.14],
  });
  return workflowInfo().searchAttributes?.CustomDoubleField[0] as number;
}
// @@@SNIPEND
