import { inferAsyncReturnType } from '@trpc/server'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { connectToTemporal } from './temporal-client'

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(_opts: CreateNextContextOptions) {
  return {
    temporal: await connectToTemporal(),
  }
}

export type Context = inferAsyncReturnType<typeof createContext>
