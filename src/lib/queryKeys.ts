/**
 * Centralized query keys make cache invalidation and query reuse predictable.
 */
export const queryKeys = {
  runs: {
    /** Cache key for a single run document. */
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
    /** Cache key for a single organization document. */
    detail(id: string) {
      return ['organizations', 'detail', id] as const
    },
    /**
     * Cache key for the list of organizations a user belongs to.
     * Shared by useUserMemberOrganizationsQuery and useUserAdminOrganizationsQuery
     * (admin query filters client-side) so a single Firestore fetch serves both.
     */
    memberOf(userId: string) {
      return ['organizations', 'member-of', userId] as const
    },
  },
  locations: {
    /** Cache key for a single location document. */
    detail(id: string) {
      return ['locations', 'detail', id] as const
    },
    /**
     * Cache key for all locations belonging to an organization.
     * Shared by useLocationsForOrganizationQuery and the fan-out
     * useLocationsForOrganizationsQuery so per-org and multi-org views
     * reuse the same cached result.
     */
    forOrganization(organizationId: string) {
      return ['locations', 'by-organization', organizationId] as const
    },
  },
  signUps: {
    /** Cache key for the sign-ups list for a single run. */
    forRun(runId: string) {
      return ['sign-ups', 'run', runId] as const
    },
  },
  users: {
    /**
     * Cache key for a batch of users fetched by their IDs.
     * IDs are normalized (deduped, sorted) before inclusion so that
     * two callers requesting the same logical set share the same cache entry.
     */
    byIds(ids: string[]) {
      const normalizedIds = Array.from(new Set(ids)).sort()
      return ['users', 'by-ids', normalizedIds] as const
    },
  },
}
