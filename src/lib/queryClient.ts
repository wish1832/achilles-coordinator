import { QueryClient } from '@tanstack/vue-query'

/**
 * Shared TanStack Query client for the application.
 * Defaults stay conservative so data is reused briefly without hiding
 * server updates for long periods.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
