import { initTRPC } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { getProductById, taskQueue } from 'common'
import { Context, createContext } from 'common/trpc-context'
import * as workflows from 'workflows'
import { z } from 'zod'

const t = initTRPC.context<Context>().create()

export const appRouter = t.router({
  hello: t.procedure.input(z.object({ text: z.string().nullish() }).nullish()).query(({ input }) => {
    return {
      greeting: `hello ${input?.text ?? 'world'} ${Math.random()}`,
    }
  }),
  order: t.procedure
    .input(z.object({ productId: z.number(), orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const productExists = !!getProductById(input.productId)
      if (!productExists) {
        throw new Error('Product not found')
      }

      await ctx.temporal.workflow.start(workflows.order, {
        workflowId: input.orderId,
        args: [input.productId],
        taskQueue,
      })
      return 'Order durably received!'
    }),
  getOrderStatus: t.procedure
    .input(z.string())
    .query(({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).query(workflows.getStatus)),
})

export type AppRouter = typeof appRouter

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
})
