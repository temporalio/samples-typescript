'use strict';

// @@@SNIPSTART nodejs-js-hello-client
const { Connection } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const example = connection.workflow('example', { taskQueue: 'tutorial' });

  const result = await example.start('Temporal');
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND