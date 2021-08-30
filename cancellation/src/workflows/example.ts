'use strict';

import { Context, CancelledError } from '@temporalio/workflow';
import { activityToBeCancelled } from '@activities/activityToBeCancelled';

const activityToBeCancelledWithTimeout = Context.configure(activityToBeCancelled, {
  type: 'remote',
  startToCloseTimeout: '60s',
  heartbeatTimeout: '3s',
});

async function main() {
  let err;
  try {
    await activityToBeCancelledWithTimeout();
  } catch (_err) {
    if (!(_err instanceof CancelledError)) {
      throw _err;
    }
    err = _err;
  }

  return { message: err == null ? null : err.message };
}

exports.workflow = { main };