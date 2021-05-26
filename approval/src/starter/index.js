'use strict';

const { Connection } = require('@temporalio/client');

async function run() {
  const connection = new Connection();
  const approval = connection.workflow('approval', { taskQueue: 'tutorial12' });

  const promise = approval.start();
  await approval.started;

  await approval.signal.deny();
  const result = await promise;
  console.log(result); // 'denied'

  /*
  await approval.signal.approve();
  const result = await promise;
  console.log(result); // 'approved'
  */
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});