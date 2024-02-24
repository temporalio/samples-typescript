import { proxyActivities, inWorkflowContext } from '@temporalio/workflow';
import { Connection, Client, WorkflowIdReusePolicy } from '@temporalio/client';
import { Worker, DefaultLogger, Runtime } from '@temporalio/worker';

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

async function starter(workflowId: string, taskQueue: string, client: Client): Promise<void> {
  const result = await client.workflow.execute(workflow, {
    taskQueue,
    workflowId,
    args: ['Temporal'],
    workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
  });
  console.log(result);
}

interface Args {
  workflowId: string;
  taskQueue: string;
}

async function main(args: Args): Promise<void> {
  const worker = await Worker.create({
    workflowsPath: __filename,
    activities,
    taskQueue: args.taskQueue,
    bundlerOptions: {
      ignoreModules: ['@temporalio/client', '@temporalio/worker'],
    },
  });
  const connection = await Connection.connect();
  const client = new Client({ connection });
  await worker.runUntil(starter(args.workflowId, args.taskQueue, client));
}

if (!inWorkflowContext()) {
  Runtime.install({ logger: new DefaultLogger('WARN') });
  main(getArgs()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

function getArgs(): Args {
  let workflowId = '';
  let taskQueue = '';
  let argv = process.argv.slice(2);
  while (argv.length) {
    const arg = argv.shift()!;
    if (['-w', '--workflow-id'].includes(arg)) {
      workflowId = argv.shift()!;
    } else if (['-t', '--task-queue'].includes(arg)) {
      taskQueue = argv.shift()!;
    } else {
      die(`unrecognized argument: ${arg}`);
    }
  }
  if (!(workflowId && taskQueue)) {
    die('');
  }
  return { workflowId, taskQueue };
}

function die(message: string) {
  console.error(`${message}
  Required arguments:
  -w, --workflow-id  workflow ID
  -t, --task-queue   task queue

  Example:
  ${process.argv.slice(0, 2).join(' ')} -w my-workflow-id -t my-task-queue`);
  process.exit(1);
}
