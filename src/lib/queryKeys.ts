/**
 * Centralized query keys make cache invalidation and query reuse predictable.
 */
export const queryKeys = {
  runs: {
    detail(id: string) {
      return ['runs', 'detail', id] as const
    },
  },
  organizations: {
    detail(id: string) {
      return ['organizations', 'detail', id] as const
    },
  },
  locations: {
    detail(id: string) {
      return ['locations', 'detail', id] as const
    },
  },
  signUps: {
    forRun(runId: string) {
      return ['sign-ups', 'run', runId] as const
    },
  },
  users: {
    byIds(ids: string[]) {
      const normalizedIds = Array.from(new Set(ids)).sort()
      return ['users', 'by-ids', normalizedIds] as const
    },
  },
}
