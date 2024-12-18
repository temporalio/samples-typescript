import { Order as OrderType, Product } from '@fooddelivery/common'
import { Order } from './Order'

export function OrderList({ orders, onOrder }: { orders: OrderType[]; onOrder: (product: Product) => void }) {
  return (
    <div className="bg-white">
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl sm:px-2 lg:px-8">
          <div className="mx-auto max-w-2xl px-4 lg:max-w-4xl lg:px-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Order history</h1>
            <p className="mt-2 text-sm text-gray-500">See the status of current and past orders</p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="sr-only">Recent orders</h2>
          <div className="mx-auto max-w-7xl sm:px-2 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-8 sm:px-4 lg:max-w-4xl lg:px-0">
              {orders.length === 0 && (
                <p className="text-center text-sm text-gray-500">You haven’t yet made an order this session.</p>
              )}
              {orders.map((order) => (
                <Order key={order.id} order={order} onOrder={onOrder} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
