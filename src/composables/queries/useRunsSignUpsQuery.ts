import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQueries } from '@tanstack/vue-query'
import { useSignUpRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { SignUp } from '@/types'

/**
 * Load sign-ups for a set of runs in parallel.
 *
 * Each run's sign-ups are stored under their own query key
 * (queryKeys.signUps.forRun(runId)) so that individual mutations
 * (e.g. useCreateOrUpdateSignUpMutation) correctly invalidate a single
 * run's entry without disturbing the others, and so that per-run and
 * multi-run consumers share the same cache entries.
 *
 * Returns a reactive map from runId to the sign-ups array for that run.
 * Run IDs with no data yet return an empty array.
 */
export function useRunsSignUpsQuery(runIds: MaybeRefOrGetter<string[]>) {
  const signUpRepository = useSignUpRepository()

  // Normalize the list (dedupe, keep stable order) so the query array
  // doesn't churn if callers pass the same ids in a different order.
  const normalizedRunIds = computed(() => Array.from(new Set(toValue(runIds))).sort())

  const queries = useQueries({
    queries: computed(() =>
      normalizedRunIds.value.map((runId) => ({
        queryKey: queryKeys.signUps.forRun(runId),
        queryFn: () => signUpRepository.getSignUpsForRun(runId),
      })),
    ),
  })

  // Map each runId to its sign-ups array. If a query hasn't resolved yet,
  // the entry is an empty array so downstream counts render as 0 rather
  // than undefined.
  const signUpsByRun = computed<Record<string, SignUp[]>>(() => {
    const result: Record<string, SignUp[]> = {}
    normalizedRunIds.value.forEach((runId, index) => {
      result[runId] = queries.value[index]?.data ?? []
    })
    return result
  })

  const isPending = computed(() => queries.value.some((query) => query.isPending))

  return {
    signUpsByRun,
    isPending,
  }
}
