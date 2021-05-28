'use strict';

const { Connection } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const example = connection.workflow('example', { taskQueue: 'tutorial17' });

  const result = await example.start();
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
