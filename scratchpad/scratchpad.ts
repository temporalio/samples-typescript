import { proxyActivities, inWorkflowContext } from '@temporalio/workflow';
import { Connection, Client } from '@temporalio/client';
import { Worker, DefaultLogger, Runtime } from '@temporalio/worker';

const workflowId = 'scratchpad';
const taskQueue = 'scratchpad';

const activities = {
  async activity(name: string): Promise<string> {
    return `Hello, ${name}!`;
  },
};

const { activity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function workflow(name: string): Promise<string> {
  return await activity(name);
}

async function starter(client: Client): Promise<void> {
  const result = await client.workflow.execute(workflow, {
    taskQueue,
    workflowId,
    args: ['Temporal'],
    workflowIdReusePolicy: 'TERMINATE_IF_RUNNING',
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
