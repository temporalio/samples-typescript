import { initTRPC } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { z } from 'zod'
import { Context, createContext } from '@fooddelivery/common/trpc-context'
import { deliveredSignal, getStatusQuery, pickedUpSignal, OrderStatusWithOrderId } from '@fooddelivery/workflows'
import {} from '@temporalio/client'

const t = initTRPC.context<Context>().create()

export const appRouter = t.router({
  pickUp: t.procedure
    .input(z.string())
    .mutation(async ({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).signal(pickedUpSignal)),

  deliver: t.procedure
    .input(z.string())
    .mutation(async ({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).signal(deliveredSignal)),

  getOrders: t.procedure.input(z.undefined()).query(async ({ ctx }) => {
    const list = await ctx.temporal.workflow.list({
      query: 'WorkflowType = "order"',
    })

    const promises: Promise<OrderStatusWithOrderId>[] = []
    for await (const workflow of list) {
      if (workflow.status.name === 'TERMINATED') {
        continue
      }
      if (promises.length >= 30) {
        break
      }

      promises.push(
        (async () => {
          const orderId = workflow.workflowId
          const status = await ctx.temporal.workflow.getHandle(orderId).query(getStatusQuery)
          return {
            ...status,
            state: workflow.status.name === 'FAILED' ? 'Failed' : status.state,
            orderId,
          }
        })(),
      )
    }

    const orders = await Promise.all(promises)
    return orders
  }),
})

export type AppRouter = typeof appRouter

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, type, path, input, ctx: _ctx, req }) {
    console.error('Error:', error)
    console.log('type:', type)
    console.log('path:', path)
    console.log('input:', input)
    console.log('req.url:', req.url)
  },
})
