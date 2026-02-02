import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDataRepository } from '@/composables/useRepositories'
import type { Run, LoadingState } from '@/types'

/**
 * Runs store using Pinia
 * Centralizes run list loading via the data repository.
 */
export const useRunsStore = defineStore('runs', () => {
  const dataRepository = useDataRepository()

  const runs = ref<Run[]>([])
  const currentRun = ref<Run | null>(null)
  const loading = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  async function loadUpcomingRuns(): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      runs.value = await dataRepository.getUpcomingRuns()
      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load runs'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Load a single run by ID
   * Sets currentRun state with the loaded run
   * @param id - Run ID to load
   */
  async function loadRun(id: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Fetch run from Firestore via repository
      const run = await dataRepository.getRun(id)

      if (!run) {
        throw new Error(`Run with id ${id} not found`)
      }

      currentRun.value = run

      // Update the run in the runs array if it exists
      const index = runs.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        runs.value[index] = run
      } else {
        // Add to array if not already present
        runs.value.push(run)
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load run'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Get run by ID from the loaded runs
   * @param id - Run ID to find
   * @returns Run or undefined if not found
   */
  function getRunById(id: string): Run | undefined {
    return runs.value.find((run) => run.id === id)
  }

  /**
   * Set the current run
   * Used when navigating to run-specific views
   * @param run - Run to set as current
   */
  function setCurrentRun(run: Run | null): void {
    currentRun.value = run
  }

  /**
   * Check if a user is an admin for a specific run.
   * Fetches the run from the repository to ensure up-to-date data,
   * then checks if the user's ID is in the run's runAdminIds array.
   * Note: Organization admins are implicit run admins per DESIGN.md,
   * but that check is handled separately by the organization store.
   * @param runId - Run ID to check
   * @param userId - User ID to check
   * @returns True if user is listed in the run's runAdminIds
   */
  async function isUserRunAdmin(runId: string, userId: string): Promise<boolean> {
    // Fetch the run from the repository to get the latest runAdminIds
    const run = await dataRepository.getRun(runId)

    if (!run) {
      return false
    }

    // Check if the user is in the run's runAdminIds array
    return run.runAdminIds?.includes(userId) ?? false
  }

  function clearError(): void {
    error.value = null
  }

  return {
    runs,
    currentRun,
    loading,
    error,
    loadUpcomingRuns,
    loadRun,
    getRunById,
    setCurrentRun,
    isUserRunAdmin,
    clearError,
  }
})
