import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Revoke admin status from an organization member.
 * On success, invalidates the org detail, users-by-ids, and the target user's
 * member-org list so views that gate controls on admin status update promptly.
 */
export function useRemoveAdminMutation() {
  const queryClient = useQueryClient()
  const organizationRepository = useOrganizationRepository()

  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      organizationRepository.removeOrganizationAdmin(organizationId, userId),
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
