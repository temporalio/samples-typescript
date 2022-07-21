import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker, Runtime, DefaultLogger, LogEntry } from '@temporalio/worker';
import { v4 as uuid4 } from 'uuid';
import { httpWorkflow } from './workflows';

async function withWorker<R>(worker: Worker, fn: () => Promise<R>): Promise<R> {
  const runAndShutdown = async () => {
    try {
      return await fn();
    } finally {
      worker.shutdown();
    }
  };
  const [_, ret] = await Promise.all([worker.run(), runAndShutdown()]);
  return ret;
}

let testEnv: TestWorkflowEnvironment;

beforeAll(async () => {
  // Use console.log instead of console.error to avoid red output
  // Filter INFO log messages for clearer test output
  Runtime.install({
    logger: new DefaultLogger('WARN', (entry: LogEntry) => console.log(`[${entry.level}]`, entry.message)),
  });

  testEnv = await TestWorkflowEnvironment.create({
    testServer: {
      stdio: 'inherit',
    },
  });
});

afterAll(async () => {
  await testEnv?.teardown();
});

test('httpWorkflow with mock activity', async () => {
  const { workflowClient, nativeConnection } = testEnv;
  const worker = await Worker.create({
    connection: nativeConnection,
    taskQueue: 'test',
    workflowsPath: require.resolve('./workflows'),
    activities: {
      makeHTTPRequest: async () => '99',
    },
  });
  await withWorker(worker, async () => {
    const result = await workflowClient.execute(httpWorkflow, {
      workflowId: uuid4(),
      taskQueue: 'test',
    });
    expect(result).toEqual('The answer is 99');
  });
});
