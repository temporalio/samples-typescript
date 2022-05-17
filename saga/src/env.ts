// Helpers for configuring the mTLS client and worker samples

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ReferenceError(`${name} environment variable is not defined`);
  }
  return value;
}

export type Env = LocalEnv | RemoteEnv;

interface LocalEnv {
  taskQueue: string;
}

interface RemoteEnv {
  taskQueue: string;
  address: string;
  namespace: string;
  clientCertPath: string;
  clientKeyPath: string;
  serverNameOverride?: string;
  serverRootCACertificatePath?: string;
}

export function isRemoteEnv(env: Env): env is RemoteEnv {
  return !!(env as any).address;
}

export function getEnv(): Env {
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'saga-demo';

  const local = (process.env.LOCAL || '').toLowerCase() === 'true';
  if (local) {
    return { taskQueue };
  }

  return {
    taskQueue,
    address: requiredEnv('TEMPORAL_ADDRESS'),
    namespace: requiredEnv('TEMPORAL_NAMESPACE'),
    clientCertPath: requiredEnv('TEMPORAL_CLIENT_CERT_PATH'),
    clientKeyPath: requiredEnv('TEMPORAL_CLIENT_KEY_PATH'),
    serverNameOverride: process.env.TEMPORAL_SERVER_NAME_OVERRIDE,
    serverRootCACertificatePath: process.env.TEMPORAL_SERVER_ROOT_CA_CERT_PATH,
  };
}
