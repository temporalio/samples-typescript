import { Worker, NativeConnection, WorkerOptions, InjectedSinks } from '@temporalio/worker';
import { createClients } from './clients';
import { createActivities } from './activities';
import * as fs from 'fs';
import { LoggerSinks } from './workflows';
import { Env, getEnv } from './env';

// worker
async function run({ local, address, namespace, clientCertPath, clientKeyPath, taskQueue }: Env) {
  const sinks: InjectedSinks<LoggerSinks> = {
    logger: {
      info: {
        fn(workflowInfo, message) {
          console.log('workflow: ', workflowInfo.runId, 'message: ', message);
        },
        callDuringReplay: false, // The default
      },
      err: {
        fn(workflowInfo, message) {
          console.error('workflow: ', workflowInfo.runId, 'message: ', message);
        },
        callDuringReplay: false, // The default
      },
    },
  };

  // registrations
  const singletonClients = await createClients();
  const activities = createActivities(singletonClients) as any;

  const opts: WorkerOptions = {
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue,
    sinks,
  };

  if (!local) {
    const crtBytes = fs.readFileSync(clientCertPath);
    const keyBytes = fs.readFileSync(clientKeyPath);

    opts.connection = await NativeConnection.create({
      address,
      tls: {
        // See docs for other TLS options
        clientCertPair: {
          crt: crtBytes,
          key: keyBytes,
        },
      },
    });
    opts.namespace = namespace;
  }
  const worker = await Worker.create(opts);

  await worker.run();
}

run(getEnv()).catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND

export default async function createWorkerClient(env: Env) {
  if (!env.local) {
    const crtBytes = fs.readFileSync(env.clientCertPath);
    const keyBytes = fs.readFileSync(env.clientKeyPath);

    return await NativeConnection.create({
      address: env.address,
      tls: {
        // See docs for other TLS options
        clientCertPair: {
          crt: crtBytes,
          key: keyBytes,
        },
      },
    });
  }
}
