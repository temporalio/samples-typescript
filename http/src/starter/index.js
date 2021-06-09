'use strict';

const { Connection } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const example = connection.workflow('example', { taskQueue: 'tutorial' });

  const result = await example.start();
  console.log(result); // 'The answer is 42'
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
