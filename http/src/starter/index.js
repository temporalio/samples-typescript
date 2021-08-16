'use strict';

const { Connection, WorkflowClient } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  const example = client.stub('example', { taskQueue: 'tutorial' });

  const result = await example.execute();
  console.log(result); // 'The answer is 42'
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
