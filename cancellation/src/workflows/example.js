'use strict';

const { Context, CancellationError, shield } = require('@temporalio/workflow');
let { activityToBeCancelled } = require('@activities/activityToBeCancelled');

activityToBeCancelled = Context.configure(activityToBeCancelled, {
  startToCloseTimeout: '60s',
  heartbeatTimeout: '3s',
});

async function main() {
  let err;
  try {
    console.log('Running activity');
    await activityToBeCancelled();
    console.log('Completed activity');
  } catch (_err) {
    console.log('Workflow cancelled!');
    if (!(_err instanceof CancellationError)) {
      throw _err;
    }
    err = _err;
  }

  return { message: err == null ? null : err.message };
}

exports.workflow = { main };