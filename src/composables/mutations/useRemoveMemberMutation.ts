import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Remove a user from an organization entirely (implies losing admin status too).
 * On success, invalidates the org detail, users-by-ids, and the removed user's
 * member-org list so that org membership lists and dashboard data stay consistent.
 */
export function useRemoveMemberMutation() {
  const queryClient = useQueryClient()
  const organizationRepository = useOrganizationRepository()

  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      organizationRepository.removeOrganizationMember(organizationId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(variables.organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byIds([]),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.memberOf(variables.userId),
      })
    },
  })
}
