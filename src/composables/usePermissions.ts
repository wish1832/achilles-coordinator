import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useOrganizationStore } from '@/stores/organization'

/**
 * Centralized authorization helpers derived from auth + org state.
 * Keep admin checks out of auth store to avoid role conflation.
 */
export function usePermissions() {
  const authStore = useAuthStore()
  const organizationStore = useOrganizationStore()

  const isAnyOrgAdmin = computed(() => {
    const user = authStore.currentUser
    if (!user) return false
    return organizationStore.getUserAdminOrganizations(user.id).length > 0
  })

  function isOrgAdmin(organizationId: string): boolean {
    const user = authStore.currentUser
    if (!user) return false
    return organizationStore.isUserOrgAdmin(organizationId, user.id)
  }

  return {
    isAnyOrgAdmin,
    isOrgAdmin,
  }
}
