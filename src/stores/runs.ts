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

  function clearError(): void {
    error.value = null
  }

  return {
    runs,
    loading,
    error,
    loadUpcomingRuns,
    clearError,
  }
})
