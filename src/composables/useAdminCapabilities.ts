import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useOrganizationStore } from '@/stores/organization'

/**
 * Centralized admin capability helpers derived from auth + org state.
 * Keeps admin checks out of the auth store and supports future run-level admins.
 */
export function useAdminCapabilities() {
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

  function isRunAdmin(runAdminIds?: string[]): boolean {
    const user = authStore.currentUser
    if (!user) return false
    return runAdminIds?.includes(user.id) ?? false
  }

  function canManageRun(organizationId: string, runAdminIds?: string[]): boolean {
    return isOrgAdmin(organizationId) || isRunAdmin(runAdminIds)
  }

  return {
    isAnyOrgAdmin,
    isOrgAdmin,
    isRunAdmin,
    canManageRun,
  }
}
