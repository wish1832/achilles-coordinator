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

  /** Returns true if the current user's ID is in the org's adminIds array. */
  function isOrgAdmin(adminIds: string[]): boolean {
    const user = authStore.currentUser
    if (!user) return false
    return adminIds.includes(user.id)
  }

  /** Returns true if the current user's ID appears in the run's runAdminIds list. */
  function isRunAdmin(runAdminIds?: string[]): boolean {
    const user = authStore.currentUser
    if (!user) return false
    return runAdminIds?.includes(user.id) ?? false
  }

  /** Returns true if the current user is an org admin or an explicit run admin. */
  function canManageRun(adminIds: string[], runAdminIds?: string[]): boolean {
    return isOrgAdmin(adminIds) || isRunAdmin(runAdminIds)
  }

  /**
   * Filter a list of organizations to those where the current user is an admin.
   * Accepts the resolved org list as a parameter so it works with TanStack Query
   * data, Pinia state, or test fixtures without reaching into stores directly.
   */
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
