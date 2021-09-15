'use strict';

import { Context, isCancellation } from '@temporalio/workflow';
import type * as activities from '../activities';

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
    if (!isCancellation(err)) {
      throw _err;
    }
    err = _err;
  }
}

exports.workflow = { main };