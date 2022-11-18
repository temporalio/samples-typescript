/*import { createReactQueryHooks } from '@trpc/react';
import type { AppRouter } from '../pages/api/trpc/[trpc]';
export const trpc = createReactQueryHooks<AppRouter>();
// => { useQuery: ..., useMutation: ...}
*/
// import { createTRPCNext } from '@trpc/next'
// import { AppRouter } from '../pages/api/[trpc]'

// export const trpc = createTRPCNext<AppRouter>({
//   config() {
//     return {
//       url: '/api',
//     }
//   },
// })

import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import type { AppRouter } from '../pages/api/[trpc]'

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: '/api',
        }),
      ],
    }
  },
})
