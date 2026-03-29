import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRunRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Run } from '@/types'

/**
 * Load a single run by ID.
 */
export function useRunQuery(runId: MaybeRefOrGetter<string>) {
  const runRepository = useRunRepository()
  const normalizedRunId = computed(() => toValue(runId))
  const queryKey = computed(() => queryKeys.runs.detail(normalizedRunId.value))

  return useQuery<Run | null>({
    queryKey,
    queryFn: () => runRepository.getRun(normalizedRunId.value),
  })
}
