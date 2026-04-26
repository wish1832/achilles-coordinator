import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQueries } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Location } from '@/types'

/**
 * Fan out one locations query per organization id and return a merged
 * `Map<locationId, Location>` for O(1) lookups by id.
 *
 * Each org's locations live under the same cache entry that
 * `useLocationsForOrganizationQuery` would create, so dashboard
 * (multi-org) and per-org views share cache.
 */
export function useLocationsForOrganizationsQuery(
  organizationIds: MaybeRefOrGetter<string[]>,
) {
  const organizationRepository = useOrganizationRepository()

  // Normalize the input: dedupe and keep stable order so the array of
  // queries doesn't churn when callers pass the same ids in a different
  // order across renders.
  const normalizedOrganizationIds = computed(() =>
    Array.from(new Set(toValue(organizationIds))).sort(),
  )

  const queries = useQueries({
    queries: computed(() =>
      normalizedOrganizationIds.value.map((orgId) => ({
        queryKey: queryKeys.locations.forOrganization(orgId),
        queryFn: () => organizationRepository.getLocationsForOrganization(orgId),
      })),
    ),
  })

  // Merge every per-org array into a single map. Locations from later
  // orgs win on id collisions, but ids are unique across orgs in practice.
  const locationsById = computed<Map<string, Location>>(() => {
    const map = new Map<string, Location>()
    for (const query of queries.value) {
      for (const location of query.data ?? []) {
        map.set(location.id, location)
      }
    }
    return map
  })

  const isPending = computed(() => queries.value.some((query) => query.isPending))
  const isError = computed(() => queries.value.some((query) => query.isError))

  function refetch(): void {
    for (const query of queries.value) query.refetch()
  }

  return {
    locationsById,
    isPending,
    isError,
    refetch,
  }
}
