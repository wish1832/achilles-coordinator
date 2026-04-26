import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Organization } from '@/types'

export function useUpdateOrgSettingsMutation() {
  const queryClient = useQueryClient()
  const organizationRepository = useOrganizationRepository()

  return useMutation({
    mutationFn: ({
      organizationId,
      updates,
    }: {
      organizationId: string
      updates: Partial<Pick<Organization, 'name' | 'description'>>
    }) => organizationRepository.updateOrganization(organizationId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(variables.organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: ['organizations', 'member-of'],
      })
    },
  })
}
