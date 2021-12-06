import { Connection, WorkflowClient } from '@temporalio/client';
import { DSLInterpreter, DSL } from './workflows';
// @ts-ignore
import { read } from 'node-yaml';

let dslInput: DSL = {
  variables: { arg1: 'value1', arg2: 'value2' },
  root: {
    sequence: {
      elements: [
        { activity: { name: 'Activity1', arguments: ['arg1'], result: 'result1' } },
        { activity: { name: 'Activity2', arguments: ['result1'], result: 'result2' } },
        { activity: { name: 'Activity3', arguments: ['arg2', 'result2'], result: 'result3' } },
      ],
    },
  },
};

async function run() {
  const path = process.argv[2];
  if (path) {
    dslInput = await read(path);
    console.log({ dslInput });
  }
  const connection = new Connection(); // Connect to localhost with default ConnectionOptions.
  // In production, pass options to the Connection constructor to configure TLS and other settings.
  // This is optional but we leave this here to remind you there is a gRPC connection being established.

  const client = new WorkflowClient(connection.service, {
    // In production you will likely specify `namespace` here; it is 'default' if omitted
  });

  // Invoke the `DSLInterpreter` Workflow, only resolved when the workflow completes
  const result = await client.execute(DSLInterpreter, {
    args: [dslInput], // type inference works! args: [name: string]
    taskQueue: 'tutorial',
    workflowId: 'my-business-id',
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
