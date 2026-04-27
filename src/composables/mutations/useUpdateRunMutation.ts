import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRunRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Run } from '@/types'

/**
 * Variables accepted by the update-run mutation.
 *
 * The repository's updateRun signature is the source of truth for what
 * fields are writable. Optional fields may be passed as null to clear
 * the stored value (the Firebase layer translates this to deleteField()).
 */
export interface UpdateRunVariables {
  runId: string
  updates: Partial<Omit<Run, 'id'>>
}

/**
 * Update a run through TanStack Query.
 * On success, the cached run detail entry is invalidated so any open
 * views reading the run via useRunQuery refetch with the saved values.
 */
export function useUpdateRunMutation() {
  const runRepository = useRunRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ runId, updates }: UpdateRunVariables) =>
      runRepository.updateRun(runId, updates),
    onSuccess: (_result, { runId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(runId) })
      // Org-scoped run lists may now be stale (date, location, or
      // organization-relevant fields could have changed). The mutation
      // doesn't know which org this run belongs to, so invalidate every
      // by-organization entry by passing only the prefix — TanStack
      // matches partially. Inactive entries just get marked stale; only
      // mounted queries refetch, so the cost is bounded.
      queryClient.invalidateQueries({ queryKey: ['runs', 'by-organization'] })
    },
  })
}
