import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRunRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Delete a run through TanStack Query.
 * On success, the run detail cache entry is removed so any subsequent
 * read for that ID refetches rather than serving the stale copy, and
 * the sign-ups entry for that run is removed since those sign-ups no
 * longer have a parent run.
 */
export function useDeleteRunMutation() {
  const runRepository = useRunRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (runId: string) => runRepository.deleteRun(runId),
    onSuccess: (_result, runId) => {
      queryClient.removeQueries({ queryKey: queryKeys.runs.detail(runId) })
      queryClient.removeQueries({ queryKey: queryKeys.signUps.forRun(runId) })
      // The deleted run still appears in any cached org-scoped run list.
      // We don't know which org it belonged to from this mutation, so
      // invalidate the entire `by-organization` branch and let active
      // queries refetch without the deleted run.
      queryClient.invalidateQueries({ queryKey: ['runs', 'by-organization'] })
    },
  })
}
