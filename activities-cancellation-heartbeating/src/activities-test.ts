import { MockActivityEnvironment } from '@temporalio/testing';
import * as assert from 'node:assert';
import { ApplicationFailure, Context, heartbeat, sleep } from '@temporalio/activity';
import { CancelledFailure } from '@temporalio/workflow';
import * as console from 'node:console';
import { ActivityExecutionDetails, myLongRunningActivity } from './activities';

describe('MyWorkflowActivities', function() {

  describe('when background heartbeating', function() {
    let testEnv: MockActivityEnvironment
    beforeEach(async function() {
      testEnv = new MockActivityEnvironment({
        startToCloseTimeoutMs: 2000,
        heartbeatTimeoutMs: 200,
        heartbeatDetails: 0,
      })
    })
    it('should sent details back', async function() {
      let actual: ActivityExecutionDetails = {
        heartbeatsReported: 0,
        mainOperationResult: undefined,
        err: undefined,
      }

      actual = await testEnv.run(myLongRunningActivity)
      assert.equal(actual.heartbeatsReported, 18)
    })
  })
  describe('when background heartbeating received cancellation notice', function() {
    let testEnv: MockActivityEnvironment
    beforeEach(async function() {
      testEnv = new MockActivityEnvironment({
        startToCloseTimeoutMs: 2000,
        heartbeatTimeoutMs: 200,
        heartbeatDetails: 0,
      })
    })
    it('should sent details back', async function() {

      const cancelPromise= async (): Promise<void> => {
        return new Promise(resolve => {
          setTimeout(() => {}, 200)
          testEnv.cancel('verify CancelledFailure bubbles up')
          resolve()
        })
      }
      const runPromise= async (): Promise<ActivityExecutionDetails>  => {
        return await testEnv.run(myLongRunningActivity)
      }
      interface fulfilled {
        value: ActivityExecutionDetails
      }
      const actual = await Promise.allSettled([cancelPromise(), runPromise()])
      assert.ok(actual[1])
      assert.equal("fulfilled", actual[1].status)
      // @ts-ignore
      assert.ok(actual[1].value.err instanceof CancelledFailure)
    })
  })
})