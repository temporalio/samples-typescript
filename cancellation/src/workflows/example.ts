'use strict';

import { CancelledFailure } from '@temporalio/common';
import { Context } from '@temporalio/workflow';
import * as activities from '../activities';

const { activityToBeCancelled } = Context.configureActivities<typeof activities>({
  type: 'remote',
  startToCloseTimeout: '60s',
  heartbeatTimeout: '3s',
});

async function main() {
  let err;
  try {
    await activityToBeCancelled();
  } catch (_err) {
    if (!(_err instanceof CancelledFailure)) {
      throw _err;
    }
    err = _err;
  }
}

exports.workflow = { main };