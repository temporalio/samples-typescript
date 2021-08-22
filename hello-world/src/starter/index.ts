'use strict';

import { Connection, WorkflowClient } from '@temporalio/client';
import { Example } from '../interfaces/workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const example = client.stub<Example>('example', { taskQueue: 'tutorial' });

  const result = await example.execute('Temporal');
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});