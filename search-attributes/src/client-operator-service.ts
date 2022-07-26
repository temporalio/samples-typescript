import { Connection } from '@temporalio/client';
import { temporal } from '@temporalio/proto';

const IndexedValueType = temporal.api.enums.v1.IndexedValueType;

async function run() {
  const connection = await Connection.connect();

  await connection.operatorService.addSearchAttributes({
    searchAttributes: {
      MyKeyword: IndexedValueType.INDEXED_VALUE_TYPE_KEYWORD,
      MyDate: IndexedValueType.INDEXED_VALUE_TYPE_DATETIME,
    },
  });

  console.log('Added Search Attributes `MyKeyword` and `MyDate` to Temporal Server');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
