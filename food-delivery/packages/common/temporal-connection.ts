import { readFileSync } from 'fs'
import { fileNotFound } from './errors'

export const namespace = process.env.NAMESPACE || 'default'

interface ConnectionOptions {
  address: string
  tls?: { clientCertPair: { crt: Buffer; key: Buffer } }
}

export function getConnectionOptions(): ConnectionOptions {
  const { TEMPORAL_SERVER = 'localhost:7233', NODE_ENV = 'development' } = process.env

  const isDeployed = ['production', 'staging'].includes(NODE_ENV)

  if (isDeployed) {
    try {
      const crt = readFileSync('./certs/server.pem')
      const key = readFileSync('./certs/server.key')

      if (crt && key) {
        return {
          address: TEMPORAL_SERVER,
          tls: {
            clientCertPair: {
              crt,
              key,
            },
          },
        }
      }
    } catch (e) {
      if (!fileNotFound(e)) {
        throw e
      }
    }
  }

  return {
    address: TEMPORAL_SERVER,
  }
}
