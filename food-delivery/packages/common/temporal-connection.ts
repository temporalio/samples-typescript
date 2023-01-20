export const namespace = process.env.NAMESPACE || 'default'

interface ConnectionOptions {
  address: string
  tls?: { clientCertPair: { crt: Buffer; key: Buffer } }
}

export function getConnectionOptions(): ConnectionOptions {
  const { TEMPORAL_SERVER = 'localhost:7233', NODE_ENV = 'development' } = process.env

  const isDeployed = ['production', 'staging'].includes(NODE_ENV)
  if (isDeployed) {
    const { TEMPORAL_CLOUD_CERT, TEMPORAL_CLOUD_KEY } = process.env

    if (TEMPORAL_CLOUD_CERT && TEMPORAL_CLOUD_KEY) {
      return {
        address: TEMPORAL_SERVER,
        tls: {
          clientCertPair: {
            crt: Buffer.from(TEMPORAL_CLOUD_CERT),
            key: Buffer.from(TEMPORAL_CLOUD_KEY),
          },
        },
      }
    }
  }

  return {
    address: TEMPORAL_SERVER,
  }
}
