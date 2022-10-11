import { WorkflowSignalWithStartOptions } from '@temporalio/client';

function getOptions<MySignalArgs extends [any, ...any[]]>(): WorkflowSignalWithStartOptions<MySignalArgs> {
  return {
    workflowId: 'test',
    taskQueue: 'test',
    signal: 'test',
    signalArgs: ['interrupted from signalWithStart'],
  };
}

async function run(): Promise<void> {
  const _opts = getOptions<[string]>();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
