import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Promote a member to admin for an organization.
 * On success, invalidates the org detail and the users-by-ids cache so any
 * open view that displays admin badges or the member list reflects the change.
 */
export function useAddAdminMutation() {
  const queryClient = useQueryClient()
  const organizationRepository = useOrganizationRepository()

  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      organizationRepository.addOrganizationAdmin(organizationId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(variables.organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byIds([]),
      })
    },
  })
}
