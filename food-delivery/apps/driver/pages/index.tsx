import { Footer, Header } from 'ui'
import { OrderTable } from '../components/OrderTable'

export default function DriverApp() {
  return (
    <div className="bg-white">
      <Header />

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="mb-24 text-center text-4xl font-bold text-gray-900" id="app-name">
          Driver Portal
        </h2>

        <OrderTable />
      </div>
      <Footer />
    </div>
  )
}
