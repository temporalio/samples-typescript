import { proxyActivities, inWorkflowContext } from '@temporalio/workflow';
import { Connection, Client } from '@temporalio/client';
import { Worker, DefaultLogger, Runtime } from '@temporalio/worker';

const taskQueue = 'my-task-queue';

const activities = {
  async greetActivity(name: string): Promise<string> {
    return `Hello, ${name}!`;
  },
};

const { greetActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function exampleWorkflow(name: string): Promise<string> {
  return await greetActivity(name);
}

async function starter(client: Client): Promise<void> {
  const result = await client.workflow.execute(exampleWorkflow, {
    taskQueue,
    workflowId: 'my-workflow-id',
    args: ['Temporal'],
  });
  console.log(result);
}

async function main(): Promise<void> {
  const worker = await Worker.create({
    workflowsPath: __filename,
    activities,
    taskQueue,
    bundlerOptions: {
      ignoreModules: ['@temporalio/client', '@temporalio/worker'],
    },
  });
  const connection = await Connection.connect();
  const client = new Client({ connection });
  await worker.runUntil(starter(client));
}

if (!inWorkflowContext()) {
  Runtime.install({ logger: new DefaultLogger('WARN') });
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
