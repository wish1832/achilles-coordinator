import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQueries } from '@tanstack/vue-query'
import { useRunRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Run } from '@/types'

/**
 * Fan out one upcoming-runs query per organization id and return the
 * merged, chronologically sorted list.
 *
 * Each org's runs live under the same cache entry that
 * `useRunsForOrganizationQuery({ timeframe: 'upcoming' })` would create,
 * so views like the dashboard (across many orgs) and OrganizationView
 * (single org) share cache entries — a mutation that invalidates one
 * org's runs key updates both surfaces.
 *
 * Returned `runs` defaults to an empty array while queries are in flight,
 * and entries from any org that has resolved are included as they arrive.
 */
export function useUpcomingRunsForOrganizationsQuery(
  organizationIds: MaybeRefOrGetter<string[]>,
) {
  const runRepository = useRunRepository()

  // Normalize the input: dedupe and keep stable order so the array of
  // queries doesn't churn when callers pass the same ids in a different
  // order across renders.
  const normalizedOrganizationIds = computed(() =>
    Array.from(new Set(toValue(organizationIds))).sort(),
  )

  // Anchor `now` to the moment the queries first register so the cache
  // key stays stable across renders. A fresh `Date()` each render would
  // otherwise churn the key and re-fetch on every reactivity tick.
  const anchorTime = new Date()

  const queries = useQueries({
    queries: computed(() =>
      normalizedOrganizationIds.value.map((orgId) => ({
        // Match the key produced by useRunsForOrganizationQuery for
        // `{ timeframe: 'upcoming' }` so cache entries are shared.
        queryKey: queryKeys.runs.forOrganizationInTimeframe(orgId, {
          mode: 'preset' as const,
          timeframe: 'upcoming' as const,
          limit: undefined,
        }),
        queryFn: () =>
          runRepository.getRunsForOrganizationInTimeframe(orgId, {
            from: anchorTime,
            direction: 'asc' as const,
          }),
      })),
    ),
  })

  // Merge the per-org arrays into a single chronologically sorted list.
  // Sort key is date+time so runs across orgs interleave correctly.
  const runs = computed<Run[]>(() => {
    const merged: Run[] = []
    for (const query of queries.value) {
      if (query.data) merged.push(...query.data)
    }
    return merged.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateDiff !== 0) return dateDiff
      // Same date: fall back to lexicographic time comparison; "HH:MM"
      // sorts correctly as a string when zero-padded.
      return (a.time ?? '').localeCompare(b.time ?? '')
    })
  })

  // Aggregate query state so callers don't have to walk the array.
  // Loading is true while any one query is still in flight; error is true
  // if any query failed (callers can decide whether to surface that as a
  // hard error or render partial results).
  const isPending = computed(() => queries.value.some((query) => query.isPending))
  const isError = computed(() => queries.value.some((query) => query.isError))

  function refetch(): void {
    for (const query of queries.value) query.refetch()
  }

  return {
    runs,
    isPending,
    isError,
    refetch,
  }
}
