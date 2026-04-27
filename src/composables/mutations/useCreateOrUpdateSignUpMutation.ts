import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useSignUpRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { SignUp } from '@/types'

/**
 * Create a new sign-up for a run, or update the existing one if the user
 * already has a sign-up for that run. On success, the sign-ups query for
 * the affected run is invalidated so any active views showing that run's
 * sign-ups refetch with the new data.
 */
export function useCreateOrUpdateSignUpMutation() {
  const signUpRepository = useSignUpRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (signUpData: Omit<SignUp, 'id'>): Promise<string> => {
      // A single atomic upsert replaces the previous read-then-write flow.
      // The repository derives a deterministic document ID from runId+userId
      // and uses a merge write, so concurrent calls cannot create duplicates.
      return signUpRepository.upsertSignUp(signUpData)
    },
    onSuccess: (_signUpId, variables) => {
      // Invalidate the sign-ups list for the affected run so subscribers
      // (e.g. RunView) refetch and display the saved values.
      queryClient.invalidateQueries({
        queryKey: queryKeys.signUps.forRun(variables.runId),
      })
    },
  })
}
