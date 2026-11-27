import { proxyActivities, inWorkflowContext } from '@temporalio/workflow';
import { Connection, Client } from '@temporalio/client';
import { Worker, DefaultLogger, Runtime } from '@temporalio/worker';
import { loadClientConnectConfig } from '@temporalio/envconfig';

const workflowId = 'scratchpad';
const taskQueue = 'scratchpad';

type GreetingInput = { name: string };
type GreetingResult = { greeting: string };

const activities = {
  async activity({ name }: GreetingInput): Promise<GreetingResult> {
    return { greeting: `Hello, ${name}!` };
  },
};

const { activity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function workflow(input: GreetingInput): Promise<GreetingResult> {
  return await activity(input);
}

async function starter(client: Client): Promise<void> {
  const result = await client.workflow.execute(workflow, {
    taskQueue,
    workflowId,
    args: [{ name: 'Temporal' }],
    workflowIdConflictPolicy: 'TERMINATE_EXISTING',
  });
  console.log(result.greeting);
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
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
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
