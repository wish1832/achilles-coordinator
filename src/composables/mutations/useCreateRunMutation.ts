import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRunRepository } from '@/composables/useRepositories'
import type { Run } from '@/types'

/**
 * Variables accepted by the create-run mutation.
 *
 * Mirrors the repository's `createRun` signature so callers don't need to
 * reshape data — pass the full run payload minus the auto-assigned id.
 */
export type CreateRunVariables = Omit<Run, 'id'>

/**
 * Create a new run through TanStack Query.
 *
 * On success, every cached `by-organization` runs list is invalidated so the
 * new run shows up in any active org-scoped view (organization page,
 * dashboard fan-out, admin stats). We invalidate the broad `['runs',
 * 'by-organization']` prefix rather than a single-org key for two reasons:
 *  1. The mutation's variables already carry `organizationId`, but using a
 *     prefix keeps invalidation behavior consistent with update/delete,
 *     where the org isn't always known.
 *  2. Only mounted queries actually refetch; inactive entries just get
 *     marked stale, so the over-invalidation is essentially free.
 */
export function useCreateRunMutation() {
  const runRepository = useRunRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (runData: CreateRunVariables): Promise<string> =>
      runRepository.createRun(runData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs', 'by-organization'] })
    },
  })
}
