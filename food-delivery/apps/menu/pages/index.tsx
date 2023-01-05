import Image from 'next/image'
import { Order, Product as ProductType, products } from 'common'
import { useState } from 'react'
import { Product } from 'ui'
import { v4 as uuid } from 'uuid'
import { trpc } from '../utils/trpc'
import { OrderList } from '../components/OrderList'

export default function CustomerApp() {
  const [orders, setOrders] = useState<Order[]>([])
  const [lastProductOrdered, setLastProductOrdered] = useState<ProductType>()

  const order = trpc.createOrder.useMutation()

  async function onOrder(product: ProductType) {
    setLastProductOrdered(product)
    const orderId = uuid()
    order.mutate(
      { productId: product.id, orderId },
      {
        onSuccess: () => {
          setOrders([{ id: orderId, product, createdAt: new Date() }, ...orders])
        },
      }
    )
  }

  return (
    <div className="bg-white">
      <header className="bg-green-600 text-white">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex w-full items-center justify-between border-b border-indigo-500 py-6 lg:border-none">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Durable Delivery logo"
                width="512"
                height="512"
                className="h-32 w-32 rounded-2xl object-cover object-center"
              />
              <div className="ml-10 hidden space-x-8 lg:block">
                <span className="text-4xl font-bold" id="app-name">
                  Durable Delivery
                </span>
              </div>
            </div>
            <div className="ml-10 space-x-4">
              Demo app for{' '}
              <a href="https://temporal.io" className="font-medium">
                Temporal
              </a>
              ,
              <br />
              the durable execution system
            </div>
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-2xl py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-center text-4xl font-bold text-gray-900" id="app-name">
          Today’s Menu
        </h2>

        <div className="mt-24 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <Product
              key={product.id}
              product={product}
              onOrder={onOrder}
              disabled={order.isLoading}
              loading={order.isLoading && lastProductOrdered?.id === product.id}
            />
          ))}
        </div>

        <OrderList orders={orders} onOrder={onOrder} />
      </div>
    </div>
  )
}
