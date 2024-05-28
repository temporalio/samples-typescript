import { Connection } from '@temporalio/client';
import { temporal } from '@temporalio/proto';

const IndexedValueType = temporal.api.enums.v1.IndexedValueType;

async function run() {
  const connection = await Connection.connect();

  const searchAttributes = {
    CustomIntField: IndexedValueType.INDEXED_VALUE_TYPE_INT,
    CustomKeywordListField: IndexedValueType.INDEXED_VALUE_TYPE_KEYWORD_LIST,
    CustomBoolField: IndexedValueType.INDEXED_VALUE_TYPE_BOOL,
    CustomDatetimeField: IndexedValueType.INDEXED_VALUE_TYPE_DATETIME,
    CustomTextField: IndexedValueType.INDEXED_VALUE_TYPE_TEXT,
  };

  await connection.operatorService.addSearchAttributes({
    namespace: 'default',
    searchAttributes,
  });

  console.log(`Added Search Attributes: ${Object.keys(searchAttributes).join(', ')} to Temporal Server`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
