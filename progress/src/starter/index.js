'use strict';

const { Connection } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const progress = connection.workflow('progress', { taskQueue: 'tutorial' });

  const promise = progress.start();
  /*console.log('Wait for start...');
  await progress.started;*/

  const val = await progress.query.getProgress();
  console.log('--->', val);

  const result = await promise;
  console.log(result); // 100
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
