import { Order, Product as ProductType, products } from 'common'
import { useState } from 'react'
import { Footer, Header, Product } from 'ui'
import { v4 as uuid } from 'uuid'
import { OrderList } from '../components/OrderList'
import { trpc } from '../utils/trpc'

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
      },
    )
  }

  return (
    <div className="bg-white">
      <Header />

      <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6 sm:pt-24 lg:max-w-7xl lg:px-8">
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
      <Footer showDriverPortal />
    </div>
  )
}
