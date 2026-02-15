import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSignUpRepository } from '@/composables/useRepositories'
import type { SignUp, LoadingState } from '@/types'

/**
 * SignUps store using Pinia
 * Centralizes sign-up data loading and management via the sign-up repository.
 * Provides CRUD operations and caching for sign-ups organized by run ID.
 */
export const useSignUpsStore = defineStore('signups', () => {
  // Use the dedicated sign-up repository for all data operations.
  const signUpRepository = useSignUpRepository()

  // Store sign-ups organized by run ID for efficient lookup.
  const signUpsByRun = ref<Record<string, SignUp[]>>({})
  // Loading state for async operations.
  const loading = ref<LoadingState>('idle')
  // Error message from the most recent failed operation.
  const error = ref<string | null>(null)

  /**
   * Load sign-ups for a specific run from the repository.
   * Updates the local cache with the fetched sign-ups.
   * @param runId - The ID of the run to load sign-ups for
   */
  async function loadSignUpsForRun(runId: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Fetch sign-ups from the repository and store them by run ID.
      const signUps = await signUpRepository.getSignUpsForRun(runId)
      signUpsByRun.value[runId] = signUps

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load sign-ups'
      loading.value = 'error'
      // Set empty array on error so counts show as 0.
      signUpsByRun.value[runId] = []
      throw err
    }
  }

  /**
   * Load sign-ups for multiple runs in parallel.
   * @param runIds - Array of run IDs to load sign-ups for
   */
  async function loadSignUpsForRuns(runIds: string[]): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Load sign-ups for all runs in parallel for better performance.
      await Promise.all(runIds.map((runId) => loadSignUpsForRun(runId)))

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load sign-ups'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Create a new sign-up for a run.
   * Automatically refreshes the local cache for the affected run.
   * @param signUpData - The sign-up data (without id)
   * @returns Promise resolving to the new sign-up document ID
   */
  async function createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    try {
      loading.value = 'loading'
      error.value = null

      // Create the sign-up in the repository.
      const signUpId = await signUpRepository.createSignUp(signUpData)

      // Refresh the cache for this run to include the new sign-up.
      await loadSignUpsForRun(signUpData.runId)

      loading.value = 'success'
      return signUpId
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create sign-up'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Update an existing sign-up.
   * Automatically refreshes the local cache for the affected run.
   * @param id - The sign-up document ID
   * @param signUpData - Partial sign-up data to update
   * @param runId - The run ID (needed to refresh the cache)
   */
  async function updateSignUp(
    id: string,
    signUpData: Partial<Omit<SignUp, 'id'>>,
    runId: string,
  ): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Update the sign-up in the repository.
      await signUpRepository.updateSignUp(id, signUpData)

      // Refresh the cache for this run to reflect the updated sign-up.
      await loadSignUpsForRun(runId)

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update sign-up'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Create a new sign-up or update an existing one for a user on a run.
   * Checks if the user already has a sign-up for the run and updates it if so,
   * otherwise creates a new sign-up.
   * @param signUpData - The sign-up data (without id)
   * @returns Promise resolving to the sign-up document ID
   */
  async function createOrUpdateSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    try {
      loading.value = 'loading'
      error.value = null

      // Check if the user already has a sign-up for this run.
      const existingSignUp = await getSignUpForRunAndUser(signUpData.runId, signUpData.userId)

      let signUpId: string

      if (existingSignUp) {
        // Update the existing sign-up with the new data.
        await signUpRepository.updateSignUp(existingSignUp.id, {
          status: signUpData.status,
          activity: signUpData.activity,
          pace: signUpData.pace,
          timestamp: signUpData.timestamp,
          notes: signUpData.notes,
        })
        signUpId = existingSignUp.id
      } else {
        // Create a new sign-up record.
        signUpId = await signUpRepository.createSignUp(signUpData)
      }

      // Refresh the cache for this run to reflect the changes.
      await loadSignUpsForRun(signUpData.runId)

      loading.value = 'success'
      return signUpId
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save sign-up'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Delete a sign-up.
   * Automatically refreshes the local cache for the affected run.
   * @param id - The sign-up document ID
   * @param runId - The run ID (needed to refresh the cache)
   */
  async function deleteSignUp(id: string, runId: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Delete the sign-up from the repository.
      await signUpRepository.deleteSignUp(id)

      // Refresh the cache for this run to remove the deleted sign-up.
      await loadSignUpsForRun(runId)

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete sign-up'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Get a user's sign-up for a specific run.
   * First checks the local cache, then falls back to the repository.
   * @param runId - The run document ID
   * @param userId - The user document ID
   * @returns Promise resolving to the sign-up or null if not found
   */
  async function getSignUpForRunAndUser(runId: string, userId: string): Promise<SignUp | null> {
    // First, check the local cache for the sign-up.
    const cachedSignUps = signUpsByRun.value[runId]
    if (cachedSignUps) {
      const cached = cachedSignUps.find((signUp) => signUp.userId === userId)
      if (cached) return cached
    }

    // If not in cache, fetch directly from the repository.
    return signUpRepository.getSignUpForRunAndUser(runId, userId)
  }

  /**
   * Get sign-ups for a specific run from the local cache.
   * Does not fetch from the repository - use loadSignUpsForRun first.
   * @param runId - The ID of the run
   * @returns Array of sign-ups for the run, or empty array if not loaded
   */
  function getSignUpsForRun(runId: string): SignUp[] {
    return signUpsByRun.value[runId] || []
  }

  /**
   * Get sign-up counts (athletes and guides) for a specific run.
   * Only counts sign-ups with status 'yes' or 'maybe' (not 'no').
   * @param runId - The ID of the run
   * @returns Object with athlete and guide counts
   */
  function getSignUpCounts(runId: string): { athletes: number; guides: number } {
    const signUps = getSignUpsForRun(runId)

    // Count athletes and guides separately.
    // Only count sign-ups with status 'yes' or 'maybe' (not 'no').
    const athletes = signUps.filter(
      (signup) => signup.role === 'athlete' && (signup.status === 'yes' || signup.status === 'maybe'),
    ).length
    const guides = signUps.filter(
      (signup) => signup.role === 'guide' && (signup.status === 'yes' || signup.status === 'maybe'),
    ).length

    return { athletes, guides }
  }

  /**
   * Clear error state.
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Clear all sign-ups data from the local cache.
   * Useful for cleanup or forcing a full refresh.
   */
  function clearSignUps(): void {
    signUpsByRun.value = {}
  }

  return {
    // State
    signUpsByRun,
    loading,
    error,
    // Repository operations (async)
    loadSignUpsForRun,
    loadSignUpsForRuns,
    createSignUp,
    updateSignUp,
    createOrUpdateSignUp,
    deleteSignUp,
    getSignUpForRunAndUser,
    // Local cache operations (sync)
    getSignUpsForRun,
    getSignUpCounts,
    clearError,
    clearSignUps,
  }
})
