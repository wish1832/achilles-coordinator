import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Organization } from '@/types'
import { useQuery } from '@tanstack/vue-query'

/**
 * Load every organization the user is an admin of.
 *
 * Fetches all member organizations and filters to only those where the user
 * is in the adminIds array. Used by views that need to bulk-check admin status
 * (e.g., DashboardView deciding which org cards show edit controls).
 */
export function useUserAdminOrganizationsQuery(userId: MaybeRefOrGetter<string | undefined>) {
  const organizationRepository = useOrganizationRepository()
  const normalizedUserId = computed(() => toValue(userId))
  const queryKey = computed(() =>
    queryKeys.organizations.memberOf(normalizedUserId.value ?? 'unknown'),
  )

  const { data: memberOrganizations, ...rest } = useQuery<Organization[]>({
    queryKey,
    enabled: computed(() => !!normalizedUserId.value),
    queryFn: () => organizationRepository.getUserOrganizations(normalizedUserId.value!),
  })

  const adminOrganizations = computed(() => {
    const uid = normalizedUserId.value
    if (!uid || !memberOrganizations.value) return []
    return memberOrganizations.value.filter((org) => org.adminIds.includes(uid))
  })

  return {
    adminOrganizations,
    ...rest,
  }
}
