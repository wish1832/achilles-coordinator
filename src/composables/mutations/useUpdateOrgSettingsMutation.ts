import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useOrganizationRepository } from '@/composables/useRepositories'
import { queryKeys } from '@/lib/queryKeys'
import type { Organization } from '@/types'

/**
 * Persist changes to an organization's name or description.
 * On success, invalidates the org detail entry and the full member-of index so
 * that any view showing the org's display name (dashboard, nav, etc.) refetches.
 */
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
