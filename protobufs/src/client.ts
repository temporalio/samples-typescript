// @@@SNIPSTART typescript-protobuf-client
import { Connection, WorkflowClient } from '@temporalio/client';
import { v4 as uuid } from 'uuid';
import { foo, ProtoResult } from '../protos/root';
import { example } from './workflows';

async function run() {
  const client = new WorkflowClient(new Connection().service, {
    dataConverter: { payloadConverterPath: require.resolve('./payload-converter') },
  });

  const handle = await client.start(example, {
    args: [foo.bar.ProtoInput.create({ name: 'Proto', age: 2 })],
    // can't do:
    // args: [new foo.bar.ProtoInput({ name: 'Proto', age: 2 })],
    taskQueue: 'protobufs',
    workflowId: 'my-business-id-' + uuid(),
  });

  console.log(`Started workflow ${handle.workflowId}`);

  const result: ProtoResult = await handle.result();
  console.log(result.toJSON());
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
