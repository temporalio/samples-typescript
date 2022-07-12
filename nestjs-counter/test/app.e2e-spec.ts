import { TestWorkflowEnvironment } from '@temporalio/testing';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { Runtime, DefaultLogger, Worker } from '@temporalio/worker';
import { CounterController } from '../src/counter/counter.controller';
import { CounterService } from '../src/counter/counter.service';
import { counterWorkflow } from '../src/workflows';
import { temporalProviders } from '../src/counter/counter-workflow.providers';

const taskQueue = 'e2e-test';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let env: TestWorkflowEnvironment;
  let worker: Worker;
  let runPromise: Promise<void>;

  beforeAll(async () => {
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.create();

    worker = await Worker.create({
      connection: env.nativeConnection,
      workflowsPath: require.resolve('../src/workflows'),
      taskQueue,
    });
    runPromise = worker.run();

    const client = env.workflowClient;
    const handle = await client.start(counterWorkflow, {
      args: [0],
      taskQueue,
      workflowId: 'counter',
    });

    const moduleFixture = await Test.createTestingModule({
      controllers: [CounterController],
      providers: [...temporalProviders, CounterService],
    })
      .overrideProvider('COUNTER_WORKFLOW')
      .useValue(handle)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    worker.shutdown();
    await runPromise;

    await env.teardown();
  });

  it('/counter (GET)', () => {
    return request(app.getHttpServer()).get('/counter').expect(200).expect('0');
  });

  it('/counter (PUT)', async () => {
    const server = app.getHttpServer();

    await request(server).get('/counter').expect(200).expect('0');

    await request(server)
      .put('/counter')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ value: 2 }))
      .expect(200);

    await request(server).get('/counter').expect(200).expect('2');
  });
});
