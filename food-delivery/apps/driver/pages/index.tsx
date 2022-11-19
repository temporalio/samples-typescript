import Image from 'next/image'
import { OrderTable } from '../components/OrderTable'

export default function DriverApp() {
  return (
    <div className="bg-white">
      <header className="bg-green-600 text-white">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex w-full items-center justify-between border-b border-indigo-500 py-6 lg:border-none">
            <div className="flex items-center">
              <Image
                priority
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
        <h2 className="mb-24 text-center text-4xl font-bold text-gray-900" id="app-name">
          Driver Portal
        </h2>

        <OrderTable />
      </div>
    </div>
  )
}
