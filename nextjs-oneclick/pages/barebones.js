import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function Bones() {

  const { data, error } = useSWR('/api/workflow', fetcher)
  if (error) return <div>failed to load <pre>{JSON.stringify(error, null, 2)}</pre></div>
  if (!data) return <div>loading...</div>
  return <header className="relative overflow-hidden">

    <div className="pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
        <div className="sm:max-w-lg">
          <h1 className="text-4xl font font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Temporal.io + Next.js One Click Purchase Demo
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Buy something, then change your mind. Or maybe not.
            Whatever you decide, Temporal makes it easy to add async processes with high reliability.
          </p>
        </div>
        <div>
          <div className="mt-10">
            <pre className="font-mono bg-gray-50 p-4">{JSON.stringify(data, null, 2)}</pre>
            <a
              href="#favorites-heading"
              className="inline-block text-center bg-indigo-600 border border-transparent rounded-md py-3 px-8 font-medium text-white hover:bg-indigo-700"
            >
              Buy some stuff
            </a>
          </div>
        </div>
      </div>
    </div>
  </header>
}

export async function getServerSideProps(context) {
  return {
    props: {}, // will be passed to the page component as props
  }
}