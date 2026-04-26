/**
 * Centralized query keys make cache invalidation and query reuse predictable.
 */
export const queryKeys = {
  runs: {
    detail(id: string) {
      return ['runs', 'detail', id] as const
    },
    /**
     * Cache key for runs scoped to an organization within a timeframe.
     *
     * `params` should be a stable, serializable descriptor — callers build it
     * from a `computed` so the same timeframe yields the same key reference
     * across renders. Date values must be normalized to ISO strings before
     * reaching this function (two `Date` instances for the same moment are
     * not `===`, which would defeat cache reuse).
     */
    forOrganizationInTimeframe(
      organizationId: string,
      params:
        | { mode: 'preset'; timeframe: 'upcoming' | 'past'; limit?: number }
        | { mode: 'custom'; from?: string; to?: string; direction: 'asc' | 'desc'; limit?: number },
    ) {
      return ['runs', 'by-organization', organizationId, params] as const
    },
  },
  organizations: {
    detail(id: string) {
      return ['organizations', 'detail', id] as const
    },
    memberOf(userId: string) {
      return ['organizations', 'member-of', userId] as const
    },
  },
  locations: {
    detail(id: string) {
      return ['locations', 'detail', id] as const
    },
    forOrganization(organizationId: string) {
      return ['locations', 'by-organization', organizationId] as const
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
