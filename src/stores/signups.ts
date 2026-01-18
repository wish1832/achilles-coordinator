import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDataRepository } from '@/composables/useRepositories'
import type { SignUp, LoadingState } from '@/types'

/**
 * SignUps store using Pinia
 * Centralizes sign-up data loading and management via the data repository.
 */
export const useSignUpsStore = defineStore('signups', () => {
  const dataRepository = useDataRepository()

  // Store sign-ups organized by run ID for efficient lookup
  const signUpsByRun = ref<Record<string, SignUp[]>>({})
  const loading = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  /**
   * Load sign-ups for a specific run
   * @param runId - The ID of the run to load sign-ups for
   */
  async function loadSignUpsForRun(runId: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      const signUps = await dataRepository.getSignUpsForRun(runId)
      signUpsByRun.value[runId] = signUps

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load sign-ups'
      loading.value = 'error'
      // Set empty array on error so counts show as 0
      signUpsByRun.value[runId] = []
      throw err
    }
  }

  /**
   * Load sign-ups for multiple runs
   * @param runIds - Array of run IDs to load sign-ups for
   */
  async function loadSignUpsForRuns(runIds: string[]): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Load sign-ups for all runs in parallel
      await Promise.all(runIds.map((runId) => loadSignUpsForRun(runId)))

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load sign-ups'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Get sign-ups for a specific run
   * @param runId - The ID of the run
   * @returns Array of sign-ups for the run, or empty array if not loaded
   */
  function getSignUpsForRun(runId: string): SignUp[] {
    return signUpsByRun.value[runId] || []
  }

  /**
   * Get sign-up counts (athletes and guides) for a specific run
   * @param runId - The ID of the run
   * @returns Object with athlete and guide counts
   */
  function getSignUpCounts(runId: string): { athletes: number; guides: number } {
    const signUps = getSignUpsForRun(runId)

    // Count athletes and guides separately
    // Only count active sign-ups (not withdrawn)
    const athletes = signUps.filter(
      (signup) => signup.role === 'athlete' && signup.status === 'active',
    ).length
    const guides = signUps.filter(
      (signup) => signup.role === 'guide' && signup.status === 'active',
    ).length

    return { athletes, guides }
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Clear all sign-ups data (useful for cleanup or refresh)
   */
  function clearSignUps(): void {
    signUpsByRun.value = {}
  }

  return {
    signUpsByRun,
    loading,
    error,
    loadSignUpsForRun,
    loadSignUpsForRuns,
    getSignUpsForRun,
    getSignUpCounts,
    clearError,
    clearSignUps,
  }
})
