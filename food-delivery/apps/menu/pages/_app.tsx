import { AppType } from 'next/dist/shared/lib/utils'
import Head from 'next/head'
import { trpc } from '../utils/trpc'
import '../styles/dist.css'

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Durable Delivery App</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default trpc.withTRPC(MyApp)
