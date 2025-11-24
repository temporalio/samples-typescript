import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../activities';
import assert from 'assert';

describe('greet activity', async () => {
  it('successfully greets the user', async () => {
    const env = new MockActivityEnvironment();
    const result = await env.run(activities.getWeather, { location: "Tokyo" });
    assert.equal(result, {
      city: "Tokyo",
      temperatureRange: '14-20C',
      conditions: 'Sunny with wind.',
    });
  });
});
