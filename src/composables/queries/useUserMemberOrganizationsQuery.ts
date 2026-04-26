import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Organization } from '@/types'

/**
 * Load every organization the user is a member of.
 *
 * Used by the dashboard to drive the org list, and as the input set for
 * fanned-out per-org runs and locations queries. Backed by a Firestore
 * `array-contains` query on `memberIds`, sorted by org name.
 */
export function useUserMemberOrganizationsQuery(userId: MaybeRefOrGetter<string | undefined>) {
  const organizationRepository = useOrganizationRepository()
  const normalizedUserId = computed(() => toValue(userId))
  const queryKey = computed(() =>
    queryKeys.organizations.memberOf(normalizedUserId.value ?? 'unknown'),
  )

  return useQuery<Organization[]>({
    queryKey,
    enabled: computed(() => !!normalizedUserId.value),
    queryFn: () => organizationRepository.getUserOrganizations(normalizedUserId.value!),
  })
}
