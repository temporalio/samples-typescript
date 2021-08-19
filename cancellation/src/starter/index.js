'use strict';

const { Connection, WorkflowClient } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const example = client.stub('example', { taskQueue: 'tutorial' });

  await example.start();

  await new Promise(resolve => setTimeout(resolve, 100));
  await example.cancel();
  console.log('Cancelled workflow successfully');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
