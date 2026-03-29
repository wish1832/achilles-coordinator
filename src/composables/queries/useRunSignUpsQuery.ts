import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useSignUpRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { SignUp } from '@/types'

/**
 * Load sign-ups for a single run.
 */
export function useRunSignUpsQuery(runId: MaybeRefOrGetter<string>) {
  const signUpRepository = useSignUpRepository()
  const normalizedRunId = computed(() => toValue(runId))
  const queryKey = computed(() => queryKeys.signUps.forRun(normalizedRunId.value))

  return useQuery<SignUp[]>({
    queryKey,
    queryFn: () => signUpRepository.getSignUpsForRun(normalizedRunId.value),
  })
}
