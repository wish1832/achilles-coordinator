import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'

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
