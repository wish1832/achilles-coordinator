import type { Organization } from '@/types'
import { useAuthStore } from '@/stores/auth'

/**
 * Centralized admin capability helpers derived from auth state + resolved org data.
 * Takes organization data as parameters instead of reading from stores, so it works
 * whether org data comes from TanStack Query, Pinia, or test fixtures.
 * Supports org-level and run-level admins.
 */
export function useAdminCapabilities() {
  const authStore = useAuthStore()

  function isOrgAdmin(adminIds: string[]): boolean {
    const user = authStore.currentUser
    if (!user) return false
    return adminIds.includes(user.id)
  }

  function isRunAdmin(runAdminIds?: string[]): boolean {
    const user = authStore.currentUser
    if (!user) return false
    return runAdminIds?.includes(user.id) ?? false
  }

  function canManageRun(adminIds: string[], runAdminIds?: string[]): boolean {
    return isOrgAdmin(adminIds) || isRunAdmin(runAdminIds)
  }

  function getUserAdminOrganizations(organizations: Organization[]): Organization[] {
    const user = authStore.currentUser
    if (!user) return []
    return organizations.filter((org) => org.adminIds.includes(user.id))
  }

  return {
    isOrgAdmin,
    isRunAdmin,
    canManageRun,
    getUserAdminOrganizations,
  }
}
