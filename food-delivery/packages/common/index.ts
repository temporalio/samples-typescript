export const taskQueue = 'durable-delivery'

export interface Image {
  src: string
  alt: string
  width: number
  height: number
}

export interface Product {
  id: number
  name: string
  description: string
  image: Image
  price: number
}

export interface Order {
  id: string
  product: Product
  createdAt: Date
}

export const products = [
  {
    id: 1,
    name: 'Swordfish',
    description: 'Cabbage, carrot, well plated',
    image: {
      src: '/swordfish.jpg',
      alt: 'Plated swordfish',
      width: 1920,
      height: 1920,
    },
    price: 35,
  },
  {
    id: 2,
    name: 'Burrata',
    description: 'Fig, peach, cherry tomato',
    image: {
      src: '/burrata.jpg',
      alt: 'Burrata fruit bowl',
      width: 1920,
      height: 1920,
    },
    price: 20,
  },
  {
    id: 3,
    name: 'Potatoes',
    description: 'Hasselback potatoes, bell pepper salad',
    image: {
      src: '/potatoes.jpg',
      alt: 'Potato dish',
      width: 1920,
      height: 2400,
    },
    price: 15,
  },
  {
    id: 4,
    name: 'Poke',
    description: 'Salmon, cucumber, seaweed, edamame',
    image: {
      src: '/poke.jpg',
      alt: 'Poke bowl',
      width: 1920,
      height: 1920,
    },
    price: 20,
  },
]

export function getProductById(id: number): Product | undefined {
  return products.find((product) => product.id === id)
}

export function errorMessage(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return undefined
}

export const statusColors: Record<string, string> = {
  'Charging card': 'gray',
  Paid: 'indigo',
  'Picked up': 'yellow',
  Delivered: 'green',
  Failed: 'red',
}
