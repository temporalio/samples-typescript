import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Runtime, DefaultLogger, Worker } from '@temporalio/worker';
import { WorkflowClient, WorkflowHandle } from '@temporalio/client';
import { getExchangeRatesQuery } from '@app/shared';
import { exchangeRatesWorkflow } from './workflows';

const taskQueue = 'test-exchange-rates';

describe('example workflow', function () {
  let client: WorkflowClient;
  let handle: WorkflowHandle;
  let shutdown: () => Promise<void>;
  let execute: () => Promise<WorkflowHandle>;
  let env: TestWorkflowEnvironment;

  beforeAll(async function () {
    jest.setTimeout(15_000);

    const activities = {
      getExchangeRates: () => Promise.resolve({ AUD: 1.27 }),
    };
    jest.spyOn(activities, 'getExchangeRates');

    // Filter INFO log messages for clearer test output
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.create();
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('./workflows.ts'),
      activities,
    });

    const runPromise = worker.run();
    shutdown = async () => {
      worker.shutdown();
      await runPromise;
    };
  });

  beforeEach(async () => {
    client = env.workflowClient;
    /* eslint-disable @typescript-eslint/no-empty-function */
    await client
      .getHandle('exchange-rates-workflow')
      .terminate()
      .catch(() => {});

    execute = async () => {
      handle = await client.start(exchangeRatesWorkflow, {
        taskQueue,
        workflowExecutionTimeout: 10_000,
        workflowId: 'exchange-rates-workflow',
      });
      return handle;
    };
  });

  afterAll(async () => {
    await shutdown();

    await env.teardown();
  });

  afterEach(async () => {
    await handle.terminate();
  });

  it('allows querying the latest exchange rate', async function () {
    const handle = await execute();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = await handle.query(getExchangeRatesQuery);
    expect(result).toEqual({ AUD: 1.27 });
  });
});
