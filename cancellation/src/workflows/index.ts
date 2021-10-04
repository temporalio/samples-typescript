'use strict';

import { createActivityHandle, isCancellation } from '@temporalio/workflow';
import { Example } from '../interfaces';
import type * as activities from '../activities';

const { activityToBeCancelled } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '60s',
  heartbeatTimeout: '3s',
});

export const example: Example = () => ({
  async execute() {
    let err;
    try {
      await activityToBeCancelled();
    } catch (_err) {
      if (!isCancellation(err)) {
        throw _err;
      }
      err = _err;
    }
  },
});
