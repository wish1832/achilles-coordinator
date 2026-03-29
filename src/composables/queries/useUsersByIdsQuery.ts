import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useUserRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { User } from '@/types'

/**
 * Load a set of users by ID through TanStack Query.
 * The IDs are normalized so equivalent sets share the same cache entry.
 */
export function useUsersByIdsQuery(userIds: MaybeRefOrGetter<string[]>) {
  const userRepository = useUserRepository()

  // This is a transitional fan-out pattern for v1.
  // It is acceptable for modest admin-only lists, but the repository layer
  // should eventually grow a bulk getUsersByIds(ids) method so larger screens
  // do not need one request per user.
  const normalizedIds = computed(() => Array.from(new Set(toValue(userIds))).sort())
  const queryKey = computed(() => queryKeys.users.byIds(normalizedIds.value))

  return useQuery<User[]>({
    queryKey,
    enabled: computed(() => normalizedIds.value.length > 0),
    queryFn: async () => {
      const users = await Promise.all(normalizedIds.value.map((id) => userRepository.getUser(id)))
      return users.filter((user): user is User => user !== null)
    },
  })
}
