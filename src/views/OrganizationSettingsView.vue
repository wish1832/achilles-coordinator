<template>
  <div class="org-settings-view">
    <!-- Hidden page heading remains available before the visible title is rendered. -->
    <h1 class="sr-only">Organization Settings</h1>
    <!-- Loading state -->
    <main v-if="organizationLoading === 'loading'" id="main-content" class="org-settings-main">
      <LoadingUI type="spinner" text="Loading organization..." centered />
    </main>

    <!-- Error state -->
    <main
      v-else-if="organizationLoading === 'error'"
      id="main-content"
      class="org-settings-main"
      tabindex="-1"
    >
      <div class="org-settings-error">
        <h1>Unable to load organization</h1>
        <p>There was an error loading the organization. Please try again.</p>
      </div>
    </main>

    <!-- Organization not found -->
    <main
      v-else-if="organizationLoading === 'success' && !organization"
      id="main-content"
      class="org-settings-main"
      tabindex="-1"
    >
      <div class="org-settings-error">
        <h1>Organization not found</h1>
        <p>The organization you're looking for doesn't exist or has been removed.</p>
      </div>
    </main>

    <!-- Organization loaded successfully -->
    <template v-else-if="organization">
      <!-- Main content -->
      <main id="main-content" class="org-settings-main">
        <div class="org-settings-container">
          <!-- Page header -->
          <div class="org-settings-header">
            <h1 class="org-settings-title">Organization Settings</h1>
          </div>

          <!-- Settings sections -->
          <div class="org-settings-sections">
            <!-- Organization details section -->
            <section class="org-settings-section" aria-labelledby="org-details-heading">
              <h2 id="org-details-heading" class="org-settings-section__title">General</h2>
              <div class="org-settings-section__content">
                <!-- Organization name field -->
                <div class="org-settings-field">
                  <label for="org-name" class="org-settings-field__label">
                    Organization Name
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    class="org-settings-input"
                    :class="{ 'org-settings-input--error': nameError }"
                    :aria-invalid="!!nameError"
                    :aria-describedby="nameError ? 'org-name-error' : undefined"
                    :value="draftOrgName"
                    @input="handleNameChange"
                  />
                  <p
                    v-if="nameError"
                    id="org-name-error"
                    class="org-settings-field__error"
                    role="alert"
                  >
                    {{ nameError }}
                  </p>
                </div>

                <!-- Organization description field -->
                <div class="org-settings-field">
                  <label for="org-description" class="org-settings-field__label">
                    Description
                  </label>
                  <textarea
                    id="org-description"
                    class="org-settings-textarea"
                    :value="draftOrgDescription"
                    @input="handleDescriptionChange"
                    rows="4"
                  ></textarea>
                </div>

                <!-- Save changes button -->
                <div class="org-settings-actions">
                  <div class="org-settings-actions__row">
                    <AchillesButton
                      :variant="isOrgSettingsDirty ? 'primary' : 'secondary'"
                      size="medium"
                      :disabled="!isOrgSettingsDirty || isOrgSettingsSaving"
                      @click="saveSettings"
                    >
                      {{ isOrgSettingsSaving ? 'Saving...' : 'Save changes' }}
                    </AchillesButton>
                    <p v-if="orgSettingsSaveError" class="org-settings-save-error" role="alert">
                      {{ orgSettingsSaveError }}
                    </p>
                    <p v-if="orgSettingsSaveSuccess" class="org-settings-success" role="status">
                      Changes saved successfully
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Members section -->
            <section class="org-settings-section" aria-labelledby="members-heading">
              <h2 id="members-heading" class="org-settings-section__title">Members</h2>
              <div class="org-settings-section__content">
                <!-- Loading state for members -->
                <LoadingUI
                  v-if="membersLoading === 'loading'"
                  type="spinner"
                  text="Loading members..."
                  size="small"
                />

                <!-- Members loaded -->
                <template v-else-if="membersLoading === 'success'">
                  <!-- Admins subsection -->
                  <div class="org-settings-members__subsection">
                    <h3 class="org-settings-members__subsection-title">Admins</h3>
                    <ul class="org-settings-members__list" aria-label="Organization admins">
                      <li
                        v-for="admin in adminUsers"
                        :key="admin.id"
                        class="org-settings-members__item"
                      >
                        <UserAvatar :display-name="admin.displayName" size="small" />
                        <span class="org-settings-members__name">
                          {{ admin.displayName }}
                          <span class="org-settings-members__role">({{ admin.role }})</span>
                        </span>
                        <ActionMenu
                          :items="getAdminMenuItems(admin.id)"
                          :aria-label="`Actions for ${admin.displayName}`"
                          @select="(item) => handleUserAction(item, admin)"
                        />
                      </li>
                      <li v-if="adminUsers.length === 0" class="org-settings-members__empty">
                        No admins found
                      </li>
                    </ul>
                  </div>

                  <!-- Members subsection (non-admins) -->
                  <div class="org-settings-members__subsection">
                    <h3 class="org-settings-members__subsection-title">Members</h3>
                    <ul class="org-settings-members__list" aria-label="Organization members">
                      <li
                        v-for="member in nonAdminMembers"
                        :key="member.id"
                        class="org-settings-members__item"
                      >
                        <UserAvatar :display-name="member.displayName" size="small" />
                        <span class="org-settings-members__name">
                          {{ member.displayName }}
                          <span class="org-settings-members__role">({{ member.role }})</span>
                        </span>
                        <ActionMenu
                          :items="getMemberMenuItems(member.id)"
                          :aria-label="`Actions for ${member.displayName}`"
                          @select="(item) => handleUserAction(item, member)"
                        />
                      </li>
                      <li v-if="nonAdminMembers.length === 0" class="org-settings-members__empty">
                        No additional members
                      </li>
                    </ul>
                  </div>
                </template>

                <!-- Error state for members -->
                <p v-else-if="membersLoading === 'error'" class="org-settings-members__error">
                  Unable to load members. Please refresh the page.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </template>

    <!-- Make Admin Confirmation Modal -->
    <ModalElement
      :is-open="isMakeAdminModalOpen"
      title="Make Admin"
      size="small"
      @close="closeAllModals"
    >
      <p v-if="selectedUser">
        Are you sure you want to make <strong>{{ selectedUser.displayName }}</strong> an admin? This
        user will be able to edit and delete runs, remove users, and modify pairings for runs.
      </p>
      <template #footer>
        <div class="modal-actions">
          <AchillesButton variant="secondary" @click="closeAllModals"> Cancel </AchillesButton>
          <AchillesButton variant="primary" @click="confirmMakeAdmin"> Confirm </AchillesButton>
        </div>
      </template>
    </ModalElement>

    <!-- Remove Admin Role Confirmation Modal -->
    <ModalElement
      :is-open="isRemoveAdminModalOpen"
      :title="isSelectedUserCurrentUser ? 'Step Down as Admin' : 'Remove Admin Role'"
      size="small"
      @close="closeAllModals"
    >
      <!-- Show a warning when the user is the only admin and tries to step down -->
      <p v-if="isSelectedUserCurrentUser && isOnlyAdmin">
        You are unable to step down as admin because you are the only admin in the group. Please
        make another user admin first.
      </p>
      <p v-else-if="selectedUser && isSelectedUserCurrentUser">
        Are you sure you want to step down as admin? You will no longer be able to edit and delete
        runs, remove users, or modify pairings for runs.
      </p>
      <p v-else-if="selectedUser">
        Are you sure you want to remove admin privileges from
        <strong>{{ selectedUser.displayName }}</strong
        >? This user will no longer be able to edit and delete runs, remove users, or modify
        pairings for runs.
      </p>
      <template #footer>
        <div class="modal-actions">
          <AchillesButton variant="secondary" @click="closeAllModals"> Cancel </AchillesButton>
          <AchillesButton variant="danger" :disabled="isOnlyAdmin" @click="confirmRemoveAdmin">
            {{ isSelectedUserCurrentUser ? 'Step Down' : 'Remove Admin Role' }}
          </AchillesButton>
        </div>
      </template>
    </ModalElement>

    <!-- Remove User / Leave Organization Confirmation Modal -->
    <ModalElement
      :is-open="isRemoveUserModalOpen"
      :title="isSelectedUserCurrentUser ? 'Leave Organization' : 'Remove User'"
      size="small"
      @close="closeAllModals"
    >
      <!-- Current user is the only admin and cannot leave -->
      <p v-if="isSelectedUserCurrentUser && isOnlyAdmin">
        You are unable to leave the group because you are the only admin in the group. Please make
        another user admin first.
      </p>
      <!-- Current user leaving the organization -->
      <template v-else-if="isSelectedUserCurrentUser">
        <p>Are you sure you want to leave this organization?</p>
        <p class="modal-warning">
          Warning! This action can't be undone. You will lose access to all organization resources.
        </p>
      </template>
      <!-- Admin removing another user -->
      <template v-else-if="selectedUser">
        <p>
          Are you sure you want to remove <strong>{{ selectedUser.displayName }}</strong> from this
          organization?
        </p>
        <p class="modal-warning">
          Warning! This action can't be undone. The user will lose access to all organization
          resources.
        </p>
      </template>
      <template #footer>
        <div class="modal-actions">
          <AchillesButton variant="secondary" @click="closeAllModals"> Cancel </AchillesButton>
          <AchillesButton
            variant="danger"
            :disabled="isSelectedUserCurrentUser && isOnlyAdmin"
            @click="confirmRemoveUser"
          >
            {{ isSelectedUserCurrentUser ? 'Leave Organization' : 'Remove User' }}
          </AchillesButton>
        </div>
      </template>
    </ModalElement>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onActivated } from 'vue'
import { useRoute } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import ModalElement from '@/components/ui/ModalElement.vue'
import { useAuthStore } from '@/stores/auth'
import { useOrganizationQuery } from '@/composables/queries/useOrganizationQuery'
import { useUsersByIdsQuery } from '@/composables/queries/useUsersByIdsQuery'
import { useDraftState } from '@/composables/useDraftState'
import { useUpdateOrgSettingsMutation } from '@/composables/mutations/useUpdateOrgSettingsMutation'
import { useAddAdminMutation } from '@/composables/mutations/useAddAdminMutation'
import { useRemoveAdminMutation } from '@/composables/mutations/useRemoveAdminMutation'
import { useRemoveMemberMutation } from '@/composables/mutations/useRemoveMemberMutation'
import type { User } from '@/types'

// Router and route
const route = useRoute()

// Store
const authStore = useAuthStore()
const navigationStore = useNavigationStore()

// Get organization ID from route params
const orgId = computed(() => route.params.orgId as string)

// Fetch organization and its members
const { data: organization, status: organizationStatus } = useOrganizationQuery(orgId)

// Back button: always goes back to this organization's page.
const orgName = computed(() => organization.value?.name ?? null)
function updateBackDestination(): void {
  navigationStore.setBackLabel(orgName.value)
  navigationStore.setBackDestination('Organization', { orgId: orgId.value })
}
watch(orgName, updateBackDestination, { immediate: true })
onActivated(updateBackDestination)

// Compute all member IDs (admins + non-admins)
const allMemberIds = computed(() => {
  if (!organization.value) return []
  return Array.from(new Set([...organization.value.adminIds, ...organization.value.memberIds]))
})

// Fetch all member user data
const {
  data: memberUsersData,
  status: memberUsersStatus,
} = useUsersByIdsQuery(allMemberIds)
const memberUsers = computed(() => memberUsersData.value ?? [])

// Map organization loading status to LoadingState
const organizationLoading = computed(() => {
  if (organizationStatus.value === 'pending') return 'loading'
  if (organizationStatus.value === 'error') return 'error'
  return 'success'
})

// Map members loading status to LoadingState
const membersLoading = computed(() => {
  if (memberUsersStatus.value === 'pending') return 'loading'
  if (memberUsersStatus.value === 'error') return 'error'
  return 'success'
})

// Validation error for the organization name field
const nameError = ref<string | null>(null)

// Mutation for updating organization settings
const updateOrgSettingsMutation = useUpdateOrgSettingsMutation()

// Initialize draft settings with useDraftState
const { draft, isDirty, isSaving, error, success, saveChanges: performSave } = useDraftState({
  data: organization,
  onSave: async (org) => {
    await updateOrgSettingsMutation.mutateAsync({
      organizationId: orgId.value,
      updates: {
        name: org.name,
        description: org.description,
      },
    })
  },
})

// Provide computed refs for draft fields with empty string fallbacks
const draftOrgName = computed({
  get: () => draft.value?.name ?? '',
  set: (value) => {
    if (draft.value) {
      draft.value.name = value
      isDirty.value = true
      success.value = false
    }
  },
})

const draftOrgDescription = computed({
  get: () => draft.value?.description ?? '',
  set: (value) => {
    if (draft.value) {
      draft.value.description = value
      isDirty.value = true
      success.value = false
    }
  },
})

// Aliases for backward compatibility with template
const isOrgSettingsDirty = isDirty
const isOrgSettingsSaving = isSaving
const orgSettingsSaveError = error
const orgSettingsSaveSuccess = success


/**
 * Computed list of admin users for this organization.
 * Filters users who are in the organization's adminIds array.
 */
const adminUsers = computed((): User[] => {
  if (!organization.value) return []
  const userMap = new Map(memberUsers.value.map((u) => [u.id, u]))
  return organization.value.adminIds
    .map((id) => userMap.get(id))
    .filter((user): user is User => user !== undefined)
})

/**
 * Computed list of non-admin member users for this organization.
 * Filters users who are in memberIds but NOT in adminIds.
 */
const nonAdminMembers = computed((): User[] => {
  if (!organization.value) return []
  const adminIdSet = new Set(organization.value.adminIds)
  const userMap = new Map(memberUsers.value.map((u) => [u.id, u]))
  return organization.value.memberIds
    .filter((id) => !adminIdSet.has(id))
    .map((id) => userMap.get(id))
    .filter((user): user is User => user !== undefined)
})

/**
 * Get menu items for an admin user.
 * If the admin is the current logged-in user, show "Step down as admin" instead.
 */
function getAdminMenuItems(adminId: string): ActionMenuItem[] {
  const isCurrentUser = authStore.currentUser?.id === adminId
  return [
    {
      id: 'remove-admin',
      label: isCurrentUser ? 'Step down as admin' : 'Remove admin role',
      danger: true,
    },
    {
      id: 'remove-user',
      label: isCurrentUser ? 'Leave organization' : 'Remove from organization',
      danger: true,
    },
  ]
}

/**
 * Get menu items for a non-admin member.
 * Members can be promoted to admin or removed from the organization.
 * If the member is the current user, show "Leave organization" instead.
 */
function getMemberMenuItems(memberId: string): ActionMenuItem[] {
  const isCurrentUser = authStore.currentUser?.id === memberId
  return [
    { id: 'make-admin', label: 'Make admin' },
    {
      id: 'remove-user',
      label: isCurrentUser ? 'Leave organization' : 'Remove from organization',
      danger: true,
    },
  ]
}

// Modal state for confirmation dialogs
const selectedUser = ref<User | null>(null)
const isMakeAdminModalOpen = ref(false)
const isRemoveAdminModalOpen = ref(false)
const isRemoveUserModalOpen = ref(false)

/**
 * Check if the selected user is the currently logged-in user.
 * Used to adjust modal language for self-actions.
 */
const isSelectedUserCurrentUser = computed(
  () => selectedUser.value?.id === authStore.currentUser?.id,
)

/**
 * Check if the selected user is the only admin in the organization.
 * Used to prevent the sole admin from stepping down.
 */
const isOnlyAdmin = computed(() => {
  if (!organization.value || !selectedUser.value) return false
  return (
    organization.value.adminIds.length === 1 &&
    organization.value.adminIds.includes(selectedUser.value.id)
  )
})

/**
 * Handle action menu item selection for a user.
 * Opens the appropriate confirmation modal based on the selected action.
 */
function handleUserAction(item: ActionMenuItem, user: User): void {
  selectedUser.value = user

  switch (item.id) {
    case 'make-admin':
      isMakeAdminModalOpen.value = true
      break
    case 'remove-admin':
      isRemoveAdminModalOpen.value = true
      break
    case 'remove-user':
      isRemoveUserModalOpen.value = true
      break
  }
}

/**
 * Close all confirmation modals and clear the selected user.
 */
function closeAllModals(): void {
  isMakeAdminModalOpen.value = false
  isRemoveAdminModalOpen.value = false
  isRemoveUserModalOpen.value = false
  selectedUser.value = null
}

// Initialize mutations
const addAdminMutation = useAddAdminMutation()
const removeAdminMutation = useRemoveAdminMutation()
const removeMemberMutation = useRemoveMemberMutation()

/**
 * Confirm making a user an admin.
 * Calls the mutation to add the user to the org's adminIds array.
 */
async function confirmMakeAdmin(): Promise<void> {
  if (selectedUser.value) {
    try {
      await addAdminMutation.mutateAsync({
        organizationId: orgId.value,
        userId: selectedUser.value.id,
      })
    } catch (err) {
      console.error('Failed to make user admin:', err)
    }
  }
  closeAllModals()
}

/**
 * Confirm removing admin role from a user.
 * Calls the mutation to remove the user from the org's adminIds array.
 * The user remains a member of the organization.
 */
async function confirmRemoveAdmin(): Promise<void> {
  if (selectedUser.value) {
    try {
      await removeAdminMutation.mutateAsync({
        organizationId: orgId.value,
        userId: selectedUser.value.id,
      })
    } catch (err) {
      console.error('Failed to remove admin role:', err)
    }
  }
  closeAllModals()
}

/**
 * Confirm removing a user from the organization.
 * Calls the mutation to remove the user from both memberIds and adminIds.
 */
async function confirmRemoveUser(): Promise<void> {
  if (selectedUser.value) {
    try {
      await removeMemberMutation.mutateAsync({
        organizationId: orgId.value,
        userId: selectedUser.value.id,
      })
    } catch (err) {
      console.error('Failed to remove user:', err)
    }
  }
  closeAllModals()
}

/**
 * Handle organization name input changes
 * Updates the draft state
 */
function handleNameChange(event: Event): void {
  const target = event.target as HTMLInputElement
  draftOrgName.value = target.value

  // Clear the error once the user types at least one non-space character
  if (nameError.value && target.value.trim().length > 0) {
    nameError.value = null
  }
}

/**
 * Handle organization description textarea changes
 * Updates the draft state
 */
function handleDescriptionChange(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  draftOrgDescription.value = target.value
}

/**
 * Save the organization settings changes
 * Validates input and persists the changes via the mutation
 */
async function saveSettings(): Promise<void> {
  // Validate that the organization name is not empty or whitespace-only
  if (!draftOrgName.value.trim()) {
    nameError.value = 'Organization name is required.'
    return
  }

  if (orgId.value) {
    await performSave()
  }
}
</script>

<style scoped>
/* Main layout */
.org-settings-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Main content */
.org-settings-main {
  padding: 2rem 0;
}

.org-settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Page header */
.org-settings-header {
  margin-bottom: 2rem;
}

.org-settings-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
  color: var(--color-text, #111827);
}

.org-settings-subtitle {
  font-size: 1.125rem;
  margin: 0;
  line-height: 1.4;
  color: var(--color-text-muted, #6b7280);
}

/* Settings sections */
.org-settings-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.org-settings-section {
  background-color: var(--color-card-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  padding: 1.5rem;
}

.org-settings-section__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0 0 1.25rem 0;
  line-height: 1.3;
}

.org-settings-section__content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Form fields */
.org-settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.org-settings-field__label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text, #111827);
}

.org-settings-field__hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

/* Text input */
.org-settings-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  color: var(--color-text, #111827);
  background-color: var(--color-input-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  transition:
    border-color 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.org-settings-input:hover {
  border-color: var(--color-primary, #0066cc);
}

.org-settings-input:focus {
  outline: none;
  border-color: var(--color-primary, #0066cc);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.15);
}

.org-settings-input:focus-visible {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

/* Error state for name input */
.org-settings-input--error {
  border-color: var(--color-error, #dc2626);
}

.org-settings-input--error:hover {
  border-color: var(--color-error, #dc2626);
}

.org-settings-input--error:focus {
  border-color: var(--color-error, #dc2626);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
}

/* Field-level error message */
.org-settings-field__error {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-error, #dc2626);
}

/* Textarea */
.org-settings-textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  color: var(--color-text, #111827);
  background-color: var(--color-input-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  resize: vertical;
  min-height: 6rem;
  transition:
    border-color 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.org-settings-textarea:hover {
  border-color: var(--color-primary, #0066cc);
}

.org-settings-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #0066cc);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.15);
}

.org-settings-textarea:focus-visible {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

/* Actions section */
.org-settings-actions {
  padding-top: 0.5rem;
}

.org-settings-actions__row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Status messages */
.org-settings-save-error {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-error, #dc2626);
}

.org-settings-success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-success, #16a34a);
}

/* Members section */
.org-settings-members__subsection {
  margin-bottom: 1.25rem;
}

.org-settings-members__subsection:last-child {
  margin-bottom: 0;
}

.org-settings-members__subsection-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 0.625rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.org-settings-members__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.org-settings-members__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.org-settings-members__name {
  font-size: 0.9375rem;
  color: var(--color-text, #111827);
}

.org-settings-members__role {
  color: var(--color-text-muted, #6b7280);
  font-size: 0.875rem;
}

.org-settings-members__empty {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  font-style: italic;
  padding: 0.5rem 0;
}

.org-settings-members__error {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-error, #dc2626);
}

/* High contrast mode */
.high-contrast .org-settings-section {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .org-settings-input,
.high-contrast .org-settings-textarea {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .org-settings-input:focus-visible,
.high-contrast .org-settings-textarea:focus-visible {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
}

.high-contrast .org-settings-input--error {
  border-color: var(--color-error, #dc2626);
  border-width: 3px;
}

/* Reduced motion support */
.reduced-motion .org-settings-input,
.reduced-motion .org-settings-textarea {
  transition: none;
}

/* Error state */
.org-settings-error {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
  max-width: 600px;
  margin: 2rem auto;
}

.org-settings-error h1 {
  color: var(--color-error, #dc2626);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.org-settings-error p {
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
}

/* Action menu right alignment */
.org-settings-members__item :deep(.action-menu) {
  margin-left: auto;
}

/* Modal styles */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-warning {
  margin-top: 1rem;
  color: var(--color-error, #dc2626);
  font-weight: 600;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .org-settings-main {
    padding: 1.5rem 0;
  }

  .org-settings-container {
    padding: 0 0.5rem;
  }

  .org-settings-title {
    font-size: 1.75rem;
  }

  .org-settings-section {
    padding: 1.25rem;
  }
}
</style>
