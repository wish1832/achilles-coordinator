import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRunRepository } from '@/composables/useRepositories'
import type { Run, LoadingState } from '@/types'

/**
 * Runs store — retained only for the router guard that fetches a run to check
 * admin permissions before navigating to the edit route. All other run state
 * is managed by TanStack Query composables.
 */
export const useRunsStore = defineStore('runs', () => {
  const runRepository = useRunRepository()

  const currentRun = ref<Run | null>(null)
  const loading = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  /**
   * Load a single run by ID and store it in currentRun.
   * Used by the router guard to verify run existence and admin access before
   * navigating to the edit route.
   * @param id - Run ID to load
   */
  async function loadRun(id: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      const run = await runRepository.getRun(id)

      if (!run) {
        throw new Error(`Run with id ${id} not found`)
      }

      // structuredClone preserves Date objects (vs JSON.parse/stringify)
      currentRun.value = structuredClone(run)

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load run'
      loading.value = 'error'
      throw err
    }
  }

  return {
    currentRun,
    loading,
    error,
    loadRun,
  }
})
