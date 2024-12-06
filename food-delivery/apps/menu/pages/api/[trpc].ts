import { initTRPC } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { z } from 'zod'
import { taskQueue } from '@fooddelivery/common'
import { Context, createContext } from '@fooddelivery/common/trpc-context'
import { getStatusQuery, order } from '@fooddelivery/workflows'
import type {} from '@temporalio/client'

const t = initTRPC.context<Context>().create()

export const appRouter = t.router({
  createOrder: t.procedure
    .input(z.object({ productId: z.number(), orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.temporal.workflow.start(order, {
        workflowId: input.orderId,
        args: [input.productId],
        taskQueue,
      })

      return 'Order received and persisted!'
    }),

  getOrderStatus: t.procedure
    .input(z.string())
    .query(({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).query(getStatusQuery)),
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
