import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Organization } from '@/types'

/**
 * Load a single organization by ID.
 */
export function useOrganizationQuery(organizationId: MaybeRefOrGetter<string | undefined>) {
  const organizationRepository = useOrganizationRepository()
  const normalizedOrganizationId = computed(() => toValue(organizationId))
  const queryKey = computed(() =>
    queryKeys.organizations.detail(normalizedOrganizationId.value ?? 'unknown'),
  )

  return useQuery<Organization | null>({
    queryKey,
    enabled: computed(() => !!normalizedOrganizationId.value),
    queryFn: () => organizationRepository.getOrganization(normalizedOrganizationId.value!),
  })
}
