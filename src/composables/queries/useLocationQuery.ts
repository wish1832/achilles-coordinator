import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Location } from '@/types'

/**
 * Load a single location by ID.
 */
export function useLocationQuery(locationId: MaybeRefOrGetter<string | undefined>) {
  const organizationRepository = useOrganizationRepository()
  const normalizedLocationId = computed(() => toValue(locationId))
  const queryKey = computed(() => queryKeys.locations.detail(normalizedLocationId.value ?? 'unknown'))

  return useQuery<Location | null>({
    queryKey,
    enabled: computed(() => !!normalizedLocationId.value),
    queryFn: () => organizationRepository.getLocation(normalizedLocationId.value!),
  })
}
