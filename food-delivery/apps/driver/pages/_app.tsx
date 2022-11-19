import { AppType } from 'next/dist/shared/lib/utils'
import { trpc } from 'menu/utils/trpc'
import '../styles/dist.css'

const MyApp: AppType = ({ Component, pageProps }) => {
  return <Component {...pageProps} />
}

export default trpc.withTRPC(MyApp)
