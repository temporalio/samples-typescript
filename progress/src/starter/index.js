'use strict';

const { Connection, WorkflowClient } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const progress = client.stub('progress', { taskQueue: 'tutorial' });

  await progress.start();

  const val = await progress.query.getProgress();
  console.log(val);

  const result = await progress.result();
  console.log(result); // 100
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
