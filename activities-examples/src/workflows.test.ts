import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker, Runtime, DefaultLogger, LogEntry } from '@temporalio/worker';
import { v4 as uuid4 } from 'uuid';
import { httpWorkflow, testWorkflow } from './workflows';
import { ApplicationFailure } from '@temporalio/workflow';
import { fnThatThrows } from './helpers';
import * as activities from './activities';

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

test('thrown from workflow', async () => {
  const { workflowClient, nativeConnection } = testEnv;
  const worker = await Worker.create({
    connection: nativeConnection,
    taskQueue: 'test',
    workflowsPath: require.resolve('./workflows'),
    activities: {
      makeHTTPRequest: async () => '99',
    },
  });
  await worker.runUntil(async () => {
    try {
      await workflowClient.execute(httpWorkflow, {
        workflowId: uuid4(),
        taskQueue: 'test',
      });
    } catch (e: any) {
      expect(e.cause instanceof ApplicationFailure).toBe(true);
    }
  });
});

test('thrown from activity, instanceof in workflow', async () => {
  const { workflowClient, nativeConnection } = testEnv;
  const worker = await Worker.create({
    connection: nativeConnection,
    taskQueue: 'test',
    workflowsPath: require.resolve('./workflows'),
    activities,
  });
  await worker.runUntil(async () => {
    const result = await workflowClient.execute(testWorkflow, {
      workflowId: uuid4(),
      taskQueue: 'test',
    });
    expect(result).toBe(true);
  });
});

test('instanceof', () => {
  try {
    fnThatThrows();
  } catch (e) {
    expect(e instanceof ApplicationFailure).toBe(true);
  }
});
