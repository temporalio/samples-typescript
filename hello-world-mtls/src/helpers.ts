import fs from 'fs/promises';

export interface Env {
  address: string;
  namespace: string;

  // TLS server validation — generally not needed if connecting to Temporal Cloud
  serverNameOverride?: string;
  serverRootCACertificate: Buffer | undefined;

  // mTLS authentication
  clientCert: Buffer | undefined;
  clientKey: Buffer | undefined;

  // API Key authentication
  apiKey?: string;

  taskQueue: string;
}

export async function getEnv(): Promise<Env> {
  return {
    address: requiredEnv('TEMPORAL_ADDRESS'),
    namespace: requiredEnv('TEMPORAL_NAMESPACE'),

    serverNameOverride: process.env.TEMPORAL_SERVER_NAME_OVERRIDE,
    serverRootCACertificate: await maybeReadFileAsBuffer(process.env.TEMPORAL_SERVER_ROOT_CA_CERT_PATH),

    clientCert: await maybeReadFileAsBuffer(process.env.TEMPORAL_CLIENT_CERT_PATH),
    clientKey: await maybeReadFileAsBuffer(process.env.TEMPORAL_CLIENT_KEY_PATH),

    apiKey: process.env.TEMPORAL_CLIENT_API_KEY,

    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'hello-world-tls',
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ReferenceError(`${name} environment variable is not defined`);
  }
  return value;
}

async function maybeReadFileAsBuffer(path?: string): Promise<Buffer | undefined> {
  if (path === undefined) return undefined;
  return await fs.readFile(path);
}
