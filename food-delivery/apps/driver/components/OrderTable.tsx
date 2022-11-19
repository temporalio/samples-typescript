import Image from 'next/image'
import { useState } from 'react'
import { getProductById, statusColors } from 'common'
import { trpc } from 'menu/utils/trpc'
import { Loading } from 'ui'

export function OrderTable() {
  const [pickedUpOrders, setPickedUpOrders] = useState(() => new Set())

  const markOrderPickedUp = (orderId: string) => {
    setPickedUpOrders((prev) => new Set(prev).add(orderId))
  }

  const [deliveredOrders, setDeliveredOrders] = useState(() => new Set())

  const markOrderDelivered = (orderId: string) => {
    setDeliveredOrders((prev) => new Set(prev).add(orderId))
  }

  const orders = trpc.getOrders.useQuery(undefined, { refetchInterval: 1000 })
  const pickUp = trpc.pickUp.useMutation()
  const deliver = trpc.deliver.useMutation()

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all the orders and their current status.</p>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Order ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.isLoading ? (
                    <tr>
                      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <Loading />
                      </td>
                    </tr>
                  ) : orders.isError ? (
                    <tr>
                      <td className="py-4 pl-4 pr-3 text-sm text-red-800 sm:pl-6">{orders.error.message}</td>
                    </tr>
                  ) : orders.data.length === 0 ? (
                    <tr>
                      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">No orders have been created yet.</td>
                    </tr>
                  ) : (
                    orders.data.map((order) => {
                      const product = getProductById(order.productId)
                      if (!product) {
                        return 'Unknown product'
                      }

                      const loadingAfterPickup = pickedUpOrders.has(order.orderId)
                      const loadingAfterDelivery = deliveredOrders.has(order.orderId)

                      return (
                        <tr key={order.orderId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <Image
                                  src={product.image.src}
                                  alt={product.image.alt}
                                  width={product.image.width}
                                  height={product.image.height}
                                  className="h-full w-full rounded-lg object-cover object-center"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-gray-500">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-500">{order.orderId}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex rounded-full text-${
                                statusColors[order.state]
                              }-800 px-2 text-xs font-semibold leading-5 bg-${statusColors[order.state]}-100`}
                            >
                              {order.state}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {order.state === 'Paid' && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 sm:w-auto"
                                onClick={() => {
                                  markOrderPickedUp(order.orderId)
                                  pickUp.mutate(order.orderId)
                                }}
                                disabled={loadingAfterPickup}
                              >
                                {loadingAfterPickup ? (
                                  <>
                                    <Loading />
                                    Marking picked up
                                  </>
                                ) : (
                                  'Pick up'
                                )}
                              </button>
                            )}
                            {order.state === 'Picked up' && (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
                                onClick={() => {
                                  markOrderDelivered(order.orderId)
                                  deliver.mutate(order.orderId)
                                }}
                                disabled={loadingAfterDelivery}
                              >
                                {loadingAfterDelivery ? (
                                  <>
                                    <Loading /> Marking delivered
                                  </>
                                ) : (
                                  'Deliver'
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
