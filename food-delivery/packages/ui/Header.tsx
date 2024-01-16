import Image from 'next/image'

export const Header = () => (
  <header className="bg-green-600 text-white">
    <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
      <div className="flex w-full items-center justify-between border-b border-indigo-500 lg:border-none">
        <div className="flex items-center">
          <Image
            src="/logo-shield.png"
            alt="Durable Delivery logo"
            width="512"
            height="512"
            className="h-52 w-52 object-cover object-center"
            priority
          />
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
)
