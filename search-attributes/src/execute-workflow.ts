import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service, {
    workflowDefaults: { taskQueue: 'search-attributes' },
  });

  // @@@SNIPSTART typescript-search-attributes-at-creation
  const result = await client.execute(example, {
    // workflowId,
    searchAttributes: {
      CustomIntField: 2, // update CustomIntField from 1 to 2, then insert other fields
      CustomKeywordField: 'Update1',
      CustomBoolField: true,
      CustomDoubleField: 3.14,
      CustomDatetimeField: new Date().toISOString(),
      CustomStringField:
        'String field is for text. When query, it will be tokenized for partial match. StringTypeField cannot be used in Order By',
    },
  });
  // @@@SNIPEND

  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
