import { ref } from 'vue'
import { useOrganizationRepository } from '@/composables/useRepositories'
import type { Organization } from '@/types'

export function useOrgSettingsDraft(organization: Organization | undefined) {
  const organizationRepository = useOrganizationRepository()

  const draftOrgName = ref<string>('')
  const draftOrgDescription = ref<string>('')
  const isOrgSettingsDirty = ref(false)
  const isOrgSettingsSaving = ref(false)
  const orgSettingsSaveError = ref<string | null>(null)
  const orgSettingsSaveSuccess = ref(false)

  // Initialize draft from provided organization
  function initializeDraft(org: Organization | undefined) {
    if (org) {
      draftOrgName.value = org.name ?? ''
      draftOrgDescription.value = org.description ?? ''
      isOrgSettingsDirty.value = false
      orgSettingsSaveError.value = null
      orgSettingsSaveSuccess.value = false
    }
  }

  function setDraftName(name: string): void {
    draftOrgName.value = name
    isOrgSettingsDirty.value = true
    orgSettingsSaveSuccess.value = false
  }

  function setDraftDescription(description: string): void {
    draftOrgDescription.value = description
    isOrgSettingsDirty.value = true
    orgSettingsSaveSuccess.value = false
  }

  async function saveChanges(organizationId: string): Promise<void> {
    orgSettingsSaveError.value = null
    orgSettingsSaveSuccess.value = false
    isOrgSettingsSaving.value = true

    try {
      await organizationRepository.updateOrganization(organizationId, {
        name: draftOrgName.value,
        description: draftOrgDescription.value,
      })
      isOrgSettingsDirty.value = false
      orgSettingsSaveSuccess.value = true
    } catch (err) {
      orgSettingsSaveError.value =
        err instanceof Error ? err.message : 'Failed to save organization settings'
    } finally {
      isOrgSettingsSaving.value = false
    }
  }

  // Initialize draft when organization prop changes
  if (organization) {
    initializeDraft(organization)
  }

  return {
    draftOrgName,
    draftOrgDescription,
    isOrgSettingsDirty,
    isOrgSettingsSaving,
    orgSettingsSaveError,
    orgSettingsSaveSuccess,
    initializeDraft,
    setDraftName,
    setDraftDescription,
    saveChanges,
  }
}
