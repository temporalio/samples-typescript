import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { Order as OrderType, Product } from '@fooddelivery/common'
import Image from 'next/image'
import { trpc } from '../utils/trpc'

export function Order({ order, onOrder }: { order: OrderType; onOrder: (product: Product) => void }) {
  const orderStatus = trpc.getOrderStatus.useQuery(order.id, { refetchInterval: 1000 })

  return (
    <div key={order.id} className="border-b border-t border-gray-200 bg-white shadow-sm sm:rounded-lg sm:border">
      <h3 className="sr-only">
        Order placed on <time dateTime={order.createdAt.toString()}>{order.createdAt.toLocaleTimeString('en-US')}</time>
      </h3>

      <dl className="grid-flow-col items-start border-b border-gray-200 p-4 sm:grid sm:gap-x-6 sm:p-6">
        {/* <dl className="grid flex-1 grid-cols-2 gap-x-6 text-sm sm:col-span-3 sm:grid-cols-3 lg:col-span-2"> */}
        <div className="flex-grow-2">
          <dt className="font-medium text-gray-900">Order number</dt>
          <dd className="mt-1 text-gray-500">{order.id}</dd>
        </div>
        <div className="hidden sm:block">
          <dt className="font-medium text-gray-900">Time placed</dt>
          <dd className="mt-1 text-gray-500">
            <time dateTime={order.createdAt.toString()}>{order.createdAt.toLocaleTimeString('en-US')}</time>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">Status</dt>
          <dd className="mt-1 text-gray-900">{orderStatus.data?.state}</dd>
        </div>
      </dl>

      <h4 className="sr-only">Items</h4>
      <ul role="list" className="divide-y divide-gray-200">
        {[order.product].map((product) => (
          <li key={product.id} className="p-4 sm:p-6">
            <div className="flex items-center sm:items-start">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 sm:h-40 sm:w-40">
                <Image
                  priority
                  src={product.image.src}
                  alt={product.image.alt}
                  width={product.image.width}
                  height={product.image.height}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="ml-6 flex-1 text-sm">
                <div className="font-medium text-gray-900 sm:flex sm:justify-between">
                  <h5>{product.name}</h5>
                  <p className="mt-2 sm:mt-0">${product.cents / 100}</p>
                </div>
                <p className="hidden text-gray-500 sm:mt-2 sm:block">{product.description}</p>
              </div>
            </div>

            <div className="mt-6 sm:flex sm:justify-between">
              <div className="flex items-center">
                {orderStatus.data?.deliveredAt && (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    <p className="ml-2 text-sm font-medium text-gray-500">
                      Delivered at{' '}
                      <time dateTime={orderStatus.data?.deliveredAt as unknown as string}>
                        {new Date(orderStatus.data?.deliveredAt).toLocaleTimeString('en-US')}
                      </time>
                    </p>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center space-x-4 divide-x divide-gray-200 border-t border-gray-200 pt-4 text-sm font-medium sm:ml-4 sm:mt-0 sm:border-none sm:pt-0">
                <div className="flex flex-1 justify-center">
                  <a href="#app-name" className="whitespace-nowrap text-indigo-600 hover:text-indigo-500">
                    View product
                  </a>
                </div>
                <div className="flex flex-1 justify-center pl-4">
                  <button
                    className="whitespace-nowrap text-indigo-600 hover:text-indigo-500"
                    onClick={() => onOrder(product)}
                  >
                    Buy again
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
