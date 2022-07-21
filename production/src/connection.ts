import { readFileSync } from 'fs';
import { fileNotFound } from './errors';

const { TEMPORAL_SERVER, NODE_ENV = 'development', NAMESPACE = 'default' } = process.env;

export { NAMESPACE as namespace };

const isDeployed = ['production', 'staging'].includes(NODE_ENV);

interface ConnectionOptions {
  address: string;
  tls?: { clientCertPair: { crt: Buffer; key: Buffer } };
}

export const connectionOptions: ConnectionOptions = {
  address: TEMPORAL_SERVER || 'localhost:7233',
};

if (isDeployed) {
  try {
    const crt = readFileSync('./certs/server.pem');
    const key = readFileSync('./certs/server.key');

    if (crt && key) {
      connectionOptions.tls = {
        clientCertPair: {
          crt,
          key,
        },
      };
    }
  } catch (e) {
    if (!fileNotFound(e)) {
      throw e;
    }
  }
}
