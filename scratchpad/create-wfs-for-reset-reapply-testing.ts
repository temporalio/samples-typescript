import * as wf from '@temporalio/workflow';
import * as wo from '@temporalio/worker';
import * as cl from '@temporalio/client';

const workflowId = 'reset-reapply-testing';
const taskQueue = 'reset-reapply-testing';

const mySignal = wf.defineSignal<[number]>('mySignal');
const doneSignal = wf.defineSignal<[]>('doneSignal');
const myUpdate = wf.defineUpdate<void, [number]>('myUpdate');

export async function workflow(): Promise<void> {
  wf.setHandler(mySignal, (ignored: number) => {});
  wf.setHandler(myUpdate, (ignored: number) => {});
  let done = false;
  wf.setHandler(doneSignal, () => {
    done = true;
  });
  await wf.condition(() => done);
}

async function starter(workflowId: string, client: cl.Client): Promise<void> {
  const wfHandle = await client.workflow.start(workflow, {
    taskQueue,
    workflowId,
  });
  for (let i = 1; i <= 10; i++) {
    await wfHandle.signal(mySignal, i);
    await wfHandle.executeUpdate(myUpdate, { args: [i] });
  }
  await wfHandle.signal(doneSignal);
  await wfHandle.result();
}

async function createCloudClientAndWorker(): Promise<{
  client: cl.Client;
  worker: wo.Worker;
}> {
  const crt = Buffer.from(`-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----`);

  const key = Buffer.from(`-----BEGIN PRIVATE KEY-----
-----END PRIVATE KEY-----`);

  const namespace = 'tideman.temporal-dev';
  const address = `${namespace}.tmprl-test.cloud:7233`;

  const connectionOptions = {
    address,
    tls: {
      clientCertPair: {
        crt,
        key,
      },
    },
  };
  const connection = await cl.Connection.connect(connectionOptions);
  const client = new cl.Client({ connection, namespace });

  const worker = await wo.Worker.create({
    workflowsPath: __filename,
    connection: await wo.NativeConnection.connect({
      address,
      tls: {
        clientCertPair: {
          crt,
          key,
        },
      },
    }),
    namespace,
    taskQueue,
    bundlerOptions: {
      ignoreModules: ['@temporalio/client', '@temporalio/worker'],
    },
  });
  return { client, worker };
}

async function createLocalClientAndWorker(): Promise<{
  client: cl.Client;
  worker: wo.Worker;
}> {
  const address = 'localhost:7233';
  const connection = await cl.Connection.connect({
    address,
  });
  const client = new cl.Client({ connection });
  const worker = await wo.Worker.create({
    workflowsPath: __filename,
    connection: await wo.NativeConnection.connect({
      address,
    }),
    taskQueue,
    bundlerOptions: {
      ignoreModules: ['@temporalio/client', '@temporalio/worker'],
    },
  });
  return { client, worker };
}

if (!wf.inWorkflowContext()) {
  wo.Runtime.install({ logger: new wo.DefaultLogger('WARN') });
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

function usage(): never {
  console.error('Usage: ts-node create-wfs-for-reset-reapply-testing.ts [--cloud]');
  process.exit(1);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let client: cl.Client;
  let worker: wo.Worker;
  if (args.length > 1) {
    usage();
  } else if (args.length == 1) {
    if (args[0] != '--cloud') {
      usage();
    }
    const { client: c, worker: w } = await createCloudClientAndWorker();
    client = c;
    worker = w;
  } else {
    const { client: c, worker: w } = await createLocalClientAndWorker();
    client = c;
    worker = w;
  }

  await worker.runUntil(async () => {
    for (let i = 1; i <= 10; i++) {
      console.log(`Starting workflow ${i}`);
      await starter(`${workflowId}-${i}`, client);
    }
  });
}
