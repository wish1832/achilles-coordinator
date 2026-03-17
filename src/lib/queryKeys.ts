/**
 * Centralized query keys make cache invalidation and query reuse predictable.
 */
export const queryKeys = {
  users: {
    byIds(ids: string[]) {
      const normalizedIds = Array.from(new Set(ids)).sort()
      return ['users', 'by-ids', normalizedIds] as const
    },
  },
}
