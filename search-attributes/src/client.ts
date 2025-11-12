import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { example } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  // @@@SNIPSTART typescript-search-attributes-client
  const handle = await client.workflow.start(example, {
    taskQueue: 'search-attributes',
    workflowId: 'search-attributes-example-0',
    searchAttributes: {
      CustomIntField: [2],
      CustomKeywordListField: ['keywordA', 'keywordB'],
      CustomBoolField: [true],
      CustomDatetimeField: [new Date()],
      CustomTextField: [
        'String field is for text. When queried, it will be tokenized for partial match. StringTypeField cannot be used in Order By',
      ],
    },
  });

  const { searchAttributes } = await handle.describe();
  // @@@SNIPEND

  console.log('searchAttributes at start:', searchAttributes);
  console.log('searchAttributes at end:', await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
