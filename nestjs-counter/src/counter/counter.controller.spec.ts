import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Runtime, DefaultLogger, Worker } from '@temporalio/worker';
import { Test, TestingModule } from '@nestjs/testing';
import { CounterController } from './counter.controller';
import { CounterService } from './counter.service';
import { counterWorkflow } from '../workflows';
import { temporalProviders } from './counter-workflow.providers';

const taskQueue = 'unit-test';

describe('CounterController', () => {
  let app: TestingModule;
  let env: TestWorkflowEnvironment;
  let worker: Worker;
  let runPromise: Promise<void>;

  beforeAll(async () => {
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.create();

    worker = await Worker.create({
      connection: env.nativeConnection,
      workflowsPath: require.resolve('../workflows'),
      taskQueue,
    });
    runPromise = worker.run();

    const client = env.workflowClient;
    const handle = await client.start(counterWorkflow, {
      args: [0],
      taskQueue,
      workflowId: 'counter',
    });

    app = await Test.createTestingModule({
      controllers: [CounterController],
      providers: [...temporalProviders, CounterService],
    })
      .overrideProvider('COUNTER_WORKFLOW')
      .useValue(handle)
      .compile();
  });

  afterAll(async () => {
    worker.shutdown();
    await runPromise;

    await env.teardown();
  });

  it('should return 0 initially', async () => {
    const counterController = app.get<CounterController>(CounterController);
    const res = await counterController.getCounter();
    expect(res).toBe(0);
  });

  it('should allow incrementing', async () => {
    const counterController = app.get<CounterController>(CounterController);
    await counterController.incrementCounter({ value: 2 });

    const res = await counterController.getCounter();
    expect(res).toBe(2);
  });
});
