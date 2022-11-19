import Image from 'next/image'
import type { Product as ProductType } from 'common'
import { Loading } from './Loading'

interface ProductProps {
  product: ProductType
  onOrder: (product: ProductType) => void
  disabled: boolean
  loading: boolean
}

export const Product = ({ product, disabled, loading, onOrder }: ProductProps) => {
  return (
    <div key={product.id}>
      <div className="relative">
        <div className="relative h-72 w-full overflow-hidden rounded-lg">
          <Image
            priority
            src={product.image.src}
            alt={product.image.alt}
            width={product.image.width}
            height={product.image.height}
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="relative mt-4">
          <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{product.description}</p>
        </div>
        <div className="absolute inset-x-0 top-0 flex h-72 items-end justify-end overflow-hidden rounded-lg p-4">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black opacity-50" />
          <p className="relative text-lg font-semibold text-white">${product.price}</p>
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={() => onOrder(product)}
          disabled={disabled}
          className="relative flex items-center justify-center rounded-md border border-transparent bg-gray-100 py-2 px-8 text-sm font-medium text-gray-900 hover:bg-gray-200"
        >
          {loading && <Loading />} Order<span className="sr-only">, {product.name}</span>
        </button>
      </div>
    </div>
  )
}
