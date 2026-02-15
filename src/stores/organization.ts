import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useOrganizationRepository } from '@/composables/useRepositories'
import type { Organization, LoadingState } from '@/types'

/**
 * Organization store using Pinia
 * Manages organization state and provides methods for CRUD operations
 * Handles organization-specific admin permissions and membership
 */
export const useOrganizationStore = defineStore('organization', () => {
  // Get repository instance via dependency injection
  // This allows for easy testing with mock implementations
  const organizationRepository = useOrganizationRepository()

  // State
  const organizations = ref<Organization[]>([])
  const currentOrganization = ref<Organization | null>(null)
  const loading = ref<LoadingState>('idle')
  const error = ref<string | null>(null)
  const loadSequence = ref(0)
  const loadedForUserId = ref<string | null>(null)

  // Getters (functions)

  /**
   * Get organization by ID from the loaded organizations
   * @param id - Organization ID to find
   * @returns Organization or undefined if not found
   */
  function getOrganizationById(id: string): Organization | undefined {
    return organizations.value.find((org) => org.id === id)
  }

  /**
   * Check if a user is an admin of a specific organization
   * @param organizationId - Organization ID to check
   * @param userId - User ID to check
   * @returns True if user is admin of the organization
   */
  function isUserOrgAdmin(organizationId: string, userId: string): boolean {
    const org = organizations.value.find((o) => o.id === organizationId)
    return org ? org.adminIds.includes(userId) : false
  }

  /**
   * Check if a user is a member of a specific organization
   * @param organizationId - Organization ID to check
   * @param userId - User ID to check
   * @returns True if user is member of the organization
   */
  function isUserOrgMember(organizationId: string, userId: string): boolean {
    const org = organizations.value.find((o) => o.id === organizationId)
    return org ? org.memberIds.includes(userId) : false
  }

  /**
   * Get all organizations where the user is an admin
   * @param userId - User ID to check
   * @returns Array of organizations where user is admin
   */
  function getUserAdminOrganizations(userId: string): Organization[] {
    return organizations.value.filter((org) => org.adminIds.includes(userId))
  }

  /**
   * Get all organizations where the user is a member
   * @param userId - User ID to check
   * @returns Array of organizations where user is member
   */
  function getUserMemberOrganizations(userId: string): Organization[] {
    return organizations.value.filter((org) => org.memberIds.includes(userId))
  }

  // Actions

  /**
   * Load all organizations from backend
   * Sets organizations state with all organizations, ordered by name
   */
  async function loadOrganizations(): Promise<void> {
    const flight = ++loadSequence.value
    try {
      loading.value = 'loading'
      error.value = null

      // Fetch all organizations from a backend via repository
      const orgs = await organizationRepository.getOrganizations()
      if (flight !== loadSequence.value) return

      organizations.value = orgs
      loadedForUserId.value = null

      if (
        currentOrganization.value &&
        !organizations.value.find((org) => org.id === currentOrganization.value?.id)
      ) {
        currentOrganization.value = null
      }

      loading.value = 'success'
    } catch (err) {
      if (flight !== loadSequence.value) return
      error.value = err instanceof Error ? err.message : 'Failed to load organizations'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Load organizations for a specific user (where they are a member)
   * @param userId - User ID to load organizations for
   */
  async function loadUserOrganizations(userId: string): Promise<void> {
    const flight = ++loadSequence.value
    try {
      loading.value = 'loading'
      error.value = null

      // Fetch user's organizations from a backend via repository
      const orgs = await organizationRepository.getUserOrganizations(userId)
      if (flight !== loadSequence.value) return

      organizations.value = orgs
      loadedForUserId.value = userId

      if (
        currentOrganization.value &&
        !organizations.value.find((org) => org.id === currentOrganization.value?.id)
      ) {
        currentOrganization.value = null
      }

      loading.value = 'success'
    } catch (err) {
      if (flight !== loadSequence.value) return
      error.value = err instanceof Error ? err.message : 'Failed to load user organizations'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Load a single organization by ID
   * @param id - Organization ID to load
   */
  async function loadOrganization(id: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Fetch organization from a backend via repository
      const org = await organizationRepository.getOrganization(id)

      if (!org) {
        throw new Error(`Organization with id ${id} not found`)
      }

      currentOrganization.value = org

      // Update the organization in the organizations array if it exists
      const index = organizations.value.findIndex((o) => o.id === id)
      if (index !== -1) {
        organizations.value[index] = org
      } else {
        // Add to array if not already present
        organizations.value.push(org)
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load organization'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Create a new organization
   * @param organizationData - Organization data (without id)
   * @returns Promise resolving to the new organization ID
   */
  async function createOrganization(
    organizationData: Omit<Organization, 'id'>,
  ): Promise<string> {
    try {
      loading.value = 'loading'
      error.value = null

      // Create organization in a backend via repository
      const id = await organizationRepository.createOrganization(organizationData)

      // Reload organizations to include the new one
      await loadOrganizations()

      loading.value = 'success'
      return id
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create organization'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Update an existing organization
   * @param id - Organization ID to update
   * @param updates - Partial organization data to update
   */
  async function updateOrganization(
    id: string,
    updates: Partial<Omit<Organization, 'id'>>,
  ): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Update organization in a backend via repository
      await organizationRepository.updateOrganization(id, updates)

      // Update local state
      const index = organizations.value.findIndex((org) => org.id === id)
      if (index !== -1 && organizations.value[index]) {
        Object.assign(organizations.value[index], updates)
      }

      // Update currentOrganization if it's the one being updated
      if (currentOrganization.value?.id === id && currentOrganization.value) {
        Object.assign(currentOrganization.value, updates)
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update organization'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Delete an organization
   * @param id - Organization ID to delete
   */
  async function deleteOrganization(id: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Delete organization from a backend via repository
      await organizationRepository.deleteOrganization(id)

      // Remove from local state
      organizations.value = organizations.value.filter((org) => org.id !== id)

      // Clear currentOrganization if it's the one being deleted
      if (currentOrganization.value?.id === id) {
        currentOrganization.value = null
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete organization'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Add a user as a member of an organization
   * @param organizationId - Organization ID
   * @param userId - User ID to add as member
   */
  async function addMember(organizationId: string, userId: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Add member via repository
      await organizationRepository.addOrganizationMember(organizationId, userId)

      // Update local state by adding userId to memberIds array
      const index = organizations.value.findIndex((org) => org.id === organizationId)
      if (index !== -1 && organizations.value[index]) {
        if (!organizations.value[index].memberIds.includes(userId)) {
          organizations.value[index].memberIds.push(userId)
        }
      }

      // Update currentOrganization if it's the one being updated
      if (currentOrganization.value?.id === organizationId && currentOrganization.value) {
        if (!currentOrganization.value.memberIds.includes(userId)) {
          currentOrganization.value.memberIds.push(userId)
        }
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add member'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Remove a user from an organization
   * Removes from both members and admins
   * @param organizationId - Organization ID
   * @param userId - User ID to remove
   */
  async function removeMember(organizationId: string, userId: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Remove member via repository
      await organizationRepository.removeOrganizationMember(organizationId, userId)

      // Update local state by removing userId from both arrays
      const index = organizations.value.findIndex((org) => org.id === organizationId)
      if (index !== -1 && organizations.value[index]) {
        organizations.value[index].memberIds = organizations.value[index].memberIds.filter(
          (id) => id !== userId,
        )
        organizations.value[index].adminIds = organizations.value[index].adminIds.filter(
          (id) => id !== userId,
        )
      }

      // Update currentOrganization if it's the one being updated
      if (currentOrganization.value?.id === organizationId && currentOrganization.value) {
        currentOrganization.value.memberIds = currentOrganization.value.memberIds.filter(
          (id) => id !== userId,
        )
        currentOrganization.value.adminIds = currentOrganization.value.adminIds.filter(
          (id) => id !== userId,
        )
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove member'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Add a user as an admin of an organization
   * Also adds them as a member if not already
   * @param organizationId - Organization ID
   * @param userId - User ID to make admin
   */
  async function addAdmin(organizationId: string, userId: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Add admin via repository
      await organizationRepository.addOrganizationAdmin(organizationId, userId)

      // Update local state by adding userId to both arrays
      const index = organizations.value.findIndex((org) => org.id === organizationId)
      if (index !== -1 && organizations.value[index]) {
        // Add to memberIds if not already present
        if (!organizations.value[index].memberIds.includes(userId)) {
          organizations.value[index].memberIds.push(userId)
        }
        // Add to adminIds if not already present
        if (!organizations.value[index].adminIds.includes(userId)) {
          organizations.value[index].adminIds.push(userId)
        }
      }

      // Update currentOrganization if it's the one being updated
      if (currentOrganization.value?.id === organizationId && currentOrganization.value) {
        if (!currentOrganization.value.memberIds.includes(userId)) {
          currentOrganization.value.memberIds.push(userId)
        }
        if (!currentOrganization.value.adminIds.includes(userId)) {
          currentOrganization.value.adminIds.push(userId)
        }
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add admin'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Remove admin status from a user in an organization
   * User remains a member
   * @param organizationId - Organization ID
   * @param userId - User ID to remove admin status from
   */
  async function removeAdmin(organizationId: string, userId: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Remove admin via repository
      await organizationRepository.removeOrganizationAdmin(organizationId, userId)

      // Update local state by removing userId from adminIds only
      const index = organizations.value.findIndex((org) => org.id === organizationId)
      if (index !== -1 && organizations.value[index]) {
        organizations.value[index].adminIds = organizations.value[index].adminIds.filter(
          (id) => id !== userId,
        )
      }

      // Update currentOrganization if it's the one being updated
      if (currentOrganization.value?.id === organizationId && currentOrganization.value) {
        currentOrganization.value.adminIds = currentOrganization.value.adminIds.filter(
          (id) => id !== userId,
        )
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove admin'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Set the current organization
   * Used when navigating to organization-specific views
   * @param organization - Organization to set as current
   */
  function setCurrentOrganization(organization: Organization | null): void {
    currentOrganization.value = organization
  }

  /**
   * Clear any error messages
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Reset the store to its initial state
   */
  function reset(): void {
    organizations.value = []
    currentOrganization.value = null
    loading.value = 'idle'
    error.value = null
    loadedForUserId.value = null
  }

  return {
    // State
    organizations,
    currentOrganization,
    loading,
    error,
    loadedForUserId,

    // Getters
    getOrganizationById,
    isUserOrgAdmin,
    isUserOrgMember,
    getUserAdminOrganizations,
    getUserMemberOrganizations,

    // Actions
    loadOrganizations,
    loadUserOrganizations,
    loadOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addMember,
    removeMember,
    addAdmin,
    removeAdmin,
    setCurrentOrganization,
    clearError,
    reset,
  }
})
