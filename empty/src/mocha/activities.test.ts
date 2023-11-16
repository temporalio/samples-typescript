import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../activities';
import assert from 'assert';

describe('your Activity', async () => {
  it('successfully runs', async () => {
    const env = new MockActivityEnvironment();
    const input = {};
    const result = await env.run(activities.YOUR_ACTIVITY, input );
    // add your assertions
  });
});
