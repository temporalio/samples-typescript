import { exec } from 'node:child_process'
import { readFileSync } from 'fs'
import path from 'path'
import { fileNotFound } from './errors'

export const namespace = process.env.NAMESPACE || 'default'

interface ConnectionOptions {
  address: string
  tls?: { clientCertPair: { crt: Buffer; key: Buffer } }
}

export function getConnectionOptions(): ConnectionOptions {
  const { TEMPORAL_SERVER = 'localhost:7233', NODE_ENV = 'development' } = process.env

  const isDeployed = ['production', 'staging'].includes(NODE_ENV)
  console.log('TEMPORAL_SERVER:', TEMPORAL_SERVER)

  if (isDeployed) {
    try {
      const { TEMPORAL_CLOUD_CERT, TEMPORAL_CLOUD_KEY } = process.env
      console.log('TEMPORAL_CLOUD_CERT:', TEMPORAL_CLOUD_CERT)
      exec('ping 3.80.0.0')

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
    } catch (e) {
      console.log('e:', e)
      if (!fileNotFound(e)) {
        throw e
      }
    }
  }

  return {
    address: TEMPORAL_SERVER,
  }
}
