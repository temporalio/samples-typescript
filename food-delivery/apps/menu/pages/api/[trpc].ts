import { temporal } from '@temporalio/proto'
import { initTRPC } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { taskQueue } from 'common'
import { Context, createContext } from 'common/trpc-context'
import { order, pickedUpSignal, deliveredSignal, getStatusQuery } from 'workflows'
import { z } from 'zod'

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

  pickUp: t.procedure
    .input(z.string())
    .mutation(async ({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).signal(pickedUpSignal)),

  deliver: t.procedure
    .input(z.string())
    .mutation(async ({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).signal(deliveredSignal)),

  getOrderStatus: t.procedure
    .input(z.string())
    .query(({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).query(getStatusQuery)),

  getOrders: t.procedure.input(z.undefined()).query(async ({ ctx }) => {
    const response = await ctx.temporal.workflowService.listWorkflowExecutions({
      namespace: ctx.temporal.workflow.options.namespace,
      query: 'WorkflowType = "order"',
      pageSize: 50,
    })
    const orders = await Promise.all(
      response.executions.map(async (workflow) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const orderId = workflow.execution!.workflowId!
        const status = await ctx.temporal.workflow.getHandle(orderId).query(getStatusQuery)
        return {
          ...status,
          state:
            workflow.status === temporal.api.enums.v1.WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_FAILED
              ? 'Failed'
              : status.state,
          orderId,
        }
      })
    )
    return orders
  }),
})

export type AppRouter = typeof appRouter

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, type, path, input, ctx, req }) {
    console.error('Error:', error)
    console.log('type:', type)
    console.log('path:', path)
    console.log('input:', input)
    console.log('req:', req.url)
  },
})
