import { initTRPC } from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { temporal } from '@temporalio/proto'
import { getProductById, taskQueue } from 'common'
import { Context, createContext } from 'common/trpc-context'
import * as workflows from 'workflows'
import { z } from 'zod'

const t = initTRPC.context<Context>().create()

export const appRouter = t.router({
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

  pickUp: t.procedure
    .input(z.string())
    .mutation(async ({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).signal(workflows.pickedUp)),

  deliver: t.procedure
    .input(z.string())
    .mutation(async ({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).signal(workflows.delivered)),

  getOrderStatus: t.procedure
    .input(z.string())
    .query(({ input: orderId, ctx }) => ctx.temporal.workflow.getHandle(orderId).query(workflows.getStatus)),

  getOrders: t.procedure.input(z.undefined()).query(async ({ ctx }) => {
    const response = await ctx.temporal.workflowService.listWorkflowExecutions({
      namespace: ctx.temporal.workflow.options.namespace,
      query: 'WorkflowType = "order" and ExecutionStatus != "Terminated" order by StartTime desc',
      pageSize: 200,
    })
    const orders = await Promise.all(
      response.executions.map(async (workflow) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const orderId = workflow.execution!.workflowId!
        const status = await ctx.temporal.workflow.getHandle(orderId).query(workflows.getStatus)
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
})
