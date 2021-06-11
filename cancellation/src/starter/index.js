'use strict';

const { Connection } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const example = connection.workflow('example', { taskQueue: 'tutorial25' });

  example.start();
  await example.started;

  await new Promise(resolve => setTimeout(resolve, 100));
  await example.cancel();
  console.log('Cancelled workflow successfully');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
