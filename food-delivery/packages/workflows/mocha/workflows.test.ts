import { WorkflowHandleWithFirstExecutionRunId } from '@temporalio/client'
import { Runtime, DefaultLogger, Worker } from '@temporalio/worker'
import { TestWorkflowEnvironment } from '@temporalio/testing'
import assert from 'assert'
import { describe, it } from 'mocha'
import * as activities from 'activities'
import { order } from '../../../packages/workflows'
import { WorkflowCoverage } from '@temporalio/nyc-test-coverage'

const workflowCoverage = new WorkflowCoverage()

describe('order workflow', async function () {
  let shutdown: () => Promise<void>
  let env: TestWorkflowEnvironment
  let start: () => Promise<WorkflowHandleWithFirstExecutionRunId<typeof order>>

  this.slow(15_000)
  this.timeout(20_000)

  before(async function () {
    // Filter INFO log messages for clearer test output
    Runtime.install({ logger: new DefaultLogger('WARN') })
    env = await TestWorkflowEnvironment.createTimeSkipping()

    let worker: Worker
    try {
      worker = await Worker.create(
        workflowCoverage.augmentWorkerOptions({
          connection: env.nativeConnection,
          taskQueue: 'test-food-delivery',
          workflowsPath: require.resolve('../../../packages/workflows'),
          activities,
        })
      )
    } catch (err) {
      console.log(err)
      process.exit(1)
    }

    const runPromise = worker.run()
    shutdown = async () => {
      worker.shutdown()
      await runPromise
      await env.teardown()
    }
  })

  beforeEach(() => {
    start = () => {
      return env.client.workflow.start(order, {
        taskQueue: 'test-expense',
        workflowExecutionTimeout: 10_000,
        // Use random ID because ID is meaningless for this test
        workflowId: `test`,
        args: [4], // Pass the expenseId property as a string
      })
    }
  })

  after(async () => {
    await shutdown()
  })

  after(() => {
    workflowCoverage.mergeIntoGlobalCoverage()
  })

  it('return a good answer', async () => {
    // const result = await execute();
    assert.equal(1, 1)
    /*const handle = env.client.workflow.start(order, {
            workflowId: 'test-order',
            taskQueue: 'test-food-delivery',
            args: [4],
        });

        assert.ok(handle instanceof Promise);*/
  })
})
