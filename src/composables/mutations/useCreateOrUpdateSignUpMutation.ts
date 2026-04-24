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
    mutationFn: async (signUpData: Omit<SignUp, 'id'>): Promise<string> => {
      // Check if the user already has a sign-up for this run. If so, update
      // it in place; otherwise create a new one. Mirrors the store behavior
      // so callers don't have to know which path to take.
      const existingSignUp = await signUpRepository.getSignUpForRunAndUser(
        signUpData.runId,
        signUpData.userId,
      )

      if (existingSignUp) {
        await signUpRepository.updateSignUp(existingSignUp.id, {
          status: signUpData.status,
          activity: signUpData.activity,
          pace: signUpData.pace,
          timestamp: signUpData.timestamp,
          notes: signUpData.notes,
        })
        return existingSignUp.id
      }

      return signUpRepository.createSignUp(signUpData)
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
