import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Location } from '@/types'

/**
 * Load every location belonging to an organization.
 *
 * Used by org-scoped views that need to render names for many runs at once
 * (one query, in-memory lookup) rather than fanning out one query per run.
 */
export function useLocationsForOrganizationQuery(
  organizationId: MaybeRefOrGetter<string | undefined>,
) {
  const organizationRepository = useOrganizationRepository()
  const normalizedOrganizationId = computed(() => toValue(organizationId))
  const queryKey = computed(() =>
    queryKeys.locations.forOrganization(normalizedOrganizationId.value ?? 'unknown'),
  )

  return useQuery<Location[]>({
    queryKey,
    enabled: computed(() => !!normalizedOrganizationId.value),
    queryFn: () =>
      organizationRepository.getLocationsForOrganization(normalizedOrganizationId.value!),
  })
}
