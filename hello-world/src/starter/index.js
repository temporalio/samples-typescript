'use strict';

// @@@SNIPSTART nodejs-js-hello-client
const { Connection, WorkflowClient } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  const example = client.stub('example', { taskQueue: 'tutorial' });

  const result = await example.execute('Temporal');
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND