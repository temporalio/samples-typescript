import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker, Runtime, DefaultLogger, LogEntry } from '@temporalio/worker';
import { v4 as uuid4 } from 'uuid';
import { httpWorkflow } from './workflows';
import { WorkflowCoverage } from '@temporalio/nyc-test-coverage';

let testEnv: TestWorkflowEnvironment;

const workflowCoverage = new WorkflowCoverage();

beforeAll(async () => {
  // Use console.log instead of console.error to avoid red output
  // Filter INFO log messages for clearer test output
  Runtime.install({
    logger: new DefaultLogger('WARN', (entry: LogEntry) => console.log(`[${entry.level}]`, entry.message)),
  });

  testEnv = await TestWorkflowEnvironment.createLocal();
});

afterAll(async () => {
  await testEnv?.teardown();
});

afterAll(() => {
  workflowCoverage.mergeIntoGlobalCoverage();
});

test('httpWorkflow with mock activity', async () => {
  const { client, nativeConnection } = testEnv;
  const worker = await Worker.create(
    workflowCoverage.augmentWorkerOptions({
      connection: nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('./workflows'),
      activities: {
        makeHTTPRequest: async () => '99',
      },
    }),
  );

  await worker.runUntil(async () => {
    const result = await client.workflow.execute(httpWorkflow, {
      workflowId: uuid4(),
      taskQueue: 'test',
    });
    expect(result).toEqual('The answer is 99');
  });
});
