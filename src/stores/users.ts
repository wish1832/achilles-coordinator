import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDataRepository } from '@/composables/useRepositories'
import type { User, LoadingState } from '@/types'

/**
 * Users store using Pinia
 * Manages user data loading and caching
 */
export const useUsersStore = defineStore('users', () => {
  // Get repository instance via dependency injection
  const dataRepository = useDataRepository()

  // State
  // Cache of loaded users by ID for efficient lookup
  const usersById = ref<Record<string, User>>({})
  const loading = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  /**
   * Load a single user by ID
   * Caches the result for future lookups
   * @param id - User ID to load
   * @returns The loaded user, or null if not found
   */
  async function loadUser(id: string): Promise<User | null> {
    try {
      loading.value = 'loading'
      error.value = null

      // Check if user is already cached
      if (usersById.value[id]) {
        loading.value = 'success'
        return usersById.value[id]
      }

      // Fetch user from Firestore via repository
      const user = await dataRepository.getUser(id)

      if (user) {
        // Cache the user
        usersById.value[id] = user
      }

      loading.value = 'success'
      return user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load user'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Load multiple users by IDs
   * Caches the results for future lookups
   * @param ids - Array of user IDs to load
   * @returns Array of loaded users (null entries filtered out)
   */
  async function loadUsers(ids: string[]): Promise<User[]> {
    try {
      loading.value = 'loading'
      error.value = null

      // Load all users in parallel
      const userPromises = ids.map((id) => loadUser(id))
      const users = await Promise.all(userPromises)

      // Filter out null results (users that weren't found)
      const validUsers = users.filter((user): user is User => user !== null)

      loading.value = 'success'
      return validUsers
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load users'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Get user by ID from the cache
   * Returns undefined if not loaded yet
   * @param id - User ID to find
   * @returns User or undefined if not cached
   */
  function getUserById(id: string): User | undefined {
    return usersById.value[id]
  }

  /**
   * Clear any error messages
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Clear the user cache
   */
  function clearCache(): void {
    usersById.value = {}
  }

  return {
    // State
    usersById,
    loading,
    error,

    // Actions
    loadUser,
    loadUsers,
    getUserById,
    clearError,
    clearCache,
  }
})
