import { WorkflowClient } from '@temporalio/client';
import { example } from './workflows';

async function run() {
  const client = new WorkflowClient();

  // @@@SNIPSTART typescript-search-attributes-client
  const handle = await client.start(example, {
    taskQueue: 'search-attributes',
    workflowId: 'search-attributes-example-0',
    searchAttributes: {
      CustomIntField: [2],
      CustomKeywordField: ['keywordA', 'keywordB'],
      CustomBoolField: [true],
      CustomDatetimeField: [new Date()],
      CustomStringField: [
        'String field is for text. When query, it will be tokenized for partial match. StringTypeField cannot be used in Order By',
      ],
    },
  });

  const { searchAttributes } = await handle.describe();
  // @@@SNIPEND

  console.log('searchAttributes:', searchAttributes);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
