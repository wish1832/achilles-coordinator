<template>
  <div class="org-settings-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Loading state -->
    <LoadingUI
      v-if="organizationLoading === 'loading'"
      type="spinner"
      text="Loading organization..."
      centered
    />

    <!-- Error state -->
    <div v-else-if="organizationLoading === 'error'" class="org-settings-error">
      <h1>Unable to load organization</h1>
      <p>There was an error loading the organization. Please try again.</p>
      <AchillesButton @click="loadOrganizationData">Try Again</AchillesButton>
    </div>

    <!-- Organization not found -->
    <div v-else-if="organizationLoading === 'success' && !organization" class="org-settings-error">
      <h1>Organization not found</h1>
      <p>The organization you're looking for doesn't exist or has been removed.</p>
    </div>

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
                    :value="organizationStore.draftOrgName"
                    @input="handleNameChange"
                  />
                </div>

                <!-- Organization description field -->
                <div class="org-settings-field">
                  <label for="org-description" class="org-settings-field__label">
                    Description
                  </label>
                  <textarea
                    id="org-description"
                    class="org-settings-textarea"
                    :value="organizationStore.draftOrgDescription"
                    @input="handleDescriptionChange"
                    rows="4"
                  ></textarea>
                </div>

                <!-- Save changes button -->
                <div class="org-settings-actions">
                  <div class="org-settings-actions__row">
                    <AchillesButton
                      :variant="organizationStore.isOrgSettingsDirty ? 'primary' : 'secondary'"
                      size="medium"
                      :disabled="
                        !organizationStore.isOrgSettingsDirty ||
                        organizationStore.isOrgSettingsSaving
                      "
                      @click="saveSettings"
                    >
                      {{ organizationStore.isOrgSettingsSaving ? 'Saving...' : 'Save changes' }}
                    </AchillesButton>
                    <p
                      v-if="organizationStore.orgSettingsSaveError"
                      class="org-settings-save-error"
                      role="alert"
                    >
                      {{ organizationStore.orgSettingsSaveError }}
                    </p>
                    <p
                      v-if="organizationStore.orgSettingsSaveSuccess"
                      class="org-settings-success"
                      role="status"
                    >
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
                          :items="memberMenuItems"
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
        Are you sure you want to make <strong>{{ selectedUser.displayName }}</strong> an admin?
        This user will be able to edit and delete runs, remove users, and modify pairings for runs.
      </p>
      <template #footer>
        <div class="modal-actions">
          <AchillesButton variant="secondary" @click="closeAllModals">
            Cancel
          </AchillesButton>
          <AchillesButton variant="primary" @click="confirmMakeAdmin">
            Confirm
          </AchillesButton>
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
      <p v-if="selectedUser && isSelectedUserCurrentUser">
        Are you sure you want to step down as admin? You will no longer be able to edit and delete
        runs, remove users, or modify pairings for runs.
      </p>
      <p v-else-if="selectedUser">
        Are you sure you want to remove admin privileges from
        <strong>{{ selectedUser.displayName }}</strong>? This user will no longer be able to edit
        and delete runs, remove users, or modify pairings for runs.
      </p>
      <template #footer>
        <div class="modal-actions">
          <AchillesButton variant="secondary" @click="closeAllModals">
            Cancel
          </AchillesButton>
          <AchillesButton variant="danger" @click="confirmRemoveAdmin">
            {{ isSelectedUserCurrentUser ? 'Step Down' : 'Remove Admin Role' }}
          </AchillesButton>
        </div>
      </template>
    </ModalElement>

    <!-- Remove User Confirmation Modal -->
    <ModalElement
      :is-open="isRemoveUserModalOpen"
      title="Remove User"
      size="small"
      @close="closeAllModals"
    >
      <p v-if="selectedUser">
        Are you sure you want to remove <strong>{{ selectedUser.displayName }}</strong> from this
        organization?
      </p>
      <p class="modal-warning">
        This action cannot be undone. The user will lose access to all organization resources.
      </p>
      <template #footer>
        <div class="modal-actions">
          <AchillesButton variant="secondary" @click="closeAllModals">
            Cancel
          </AchillesButton>
          <AchillesButton variant="danger" @click="confirmRemoveUser">
            Remove User
          </AchillesButton>
        </div>
      </template>
    </ModalElement>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import ModalElement from '@/components/ui/ModalElement.vue'
import { useOrganizationStore } from '@/stores/organization'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import type { LoadingState, User } from '@/types'

// Router and route
const route = useRoute()

// Stores
const organizationStore = useOrganizationStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()

// Local loading state
const organizationLoading = ref<LoadingState>('idle')

// Get organization ID from route params
const orgId = computed(() => route.params.orgId as string)

// Get current organization from store
const organization = computed(() => organizationStore.getOrganizationById(orgId.value))

// Loading state for members
const membersLoading = ref<LoadingState>('idle')

/**
 * Computed list of admin users for this organization.
 * Filters users who are in the organization's adminIds array.
 */
const adminUsers = computed((): User[] => {
  if (!organization.value) return []
  return organization.value.adminIds
    .map((id) => usersStore.getUserById(id))
    .filter((user): user is User => user !== undefined)
})

/**
 * Computed list of non-admin member users for this organization.
 * Filters users who are in memberIds but NOT in adminIds.
 */
const nonAdminMembers = computed((): User[] => {
  if (!organization.value) return []
  const adminIdSet = new Set(organization.value.adminIds)
  return organization.value.memberIds
    .filter((id) => !adminIdSet.has(id))
    .map((id) => usersStore.getUserById(id))
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
    { id: 'remove-user', label: 'Remove from organization', danger: true },
  ]
}

/**
 * Menu items for non-admin members.
 * Members can be promoted to admin or removed from the organization.
 */
const memberMenuItems: ActionMenuItem[] = [
  { id: 'make-admin', label: 'Make admin' },
  { id: 'remove-user', label: 'Remove from organization', danger: true },
]

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

/**
 * Confirm making a user an admin.
 * TODO: Implement the actual admin promotion logic.
 */
function confirmMakeAdmin(): void {
  if (selectedUser.value) {
    console.log(`Making ${selectedUser.value.displayName} an admin`)
    // TODO: Call store method to add user to adminIds
  }
  closeAllModals()
}

/**
 * Confirm removing admin role from a user.
 * TODO: Implement the actual admin removal logic.
 */
function confirmRemoveAdmin(): void {
  if (selectedUser.value) {
    console.log(`Removing admin role from ${selectedUser.value.displayName}`)
    // TODO: Call store method to remove user from adminIds
  }
  closeAllModals()
}

/**
 * Confirm removing a user from the organization.
 * TODO: Implement the actual user removal logic.
 */
function confirmRemoveUser(): void {
  if (selectedUser.value) {
    console.log(`Removing ${selectedUser.value.displayName} from organization`)
    // TODO: Call store method to remove user from memberIds
  }
  closeAllModals()
}

/**
 * Load organization data from the store
 */
async function loadOrganizationData(): Promise<void> {
  try {
    organizationLoading.value = 'loading'
    await organizationStore.loadOrganization(orgId.value)
    organizationLoading.value = 'success'
  } catch {
    organizationLoading.value = 'error'
  }
}

/**
 * Load user data for all organization members.
 * Fetches user details for both admins and regular members.
 */
async function loadMembersData(): Promise<void> {
  if (!organization.value) return

  try {
    membersLoading.value = 'loading'
    // Combine adminIds and memberIds, removing duplicates
    const allMemberIds = [
      ...new Set([...organization.value.adminIds, ...organization.value.memberIds]),
    ]
    await usersStore.loadUsers(allMemberIds)
    membersLoading.value = 'success'
  } catch {
    membersLoading.value = 'error'
  }
}

// Load organization data on mount and initialize the draft state for editing
onMounted(async () => {
  await loadOrganizationData()
  // Initialize draft values after organization data is loaded
  if (orgId.value) {
    organizationStore.initializeOrgSettingsDraft(orgId.value)
  }
  // Load member user data after organization is loaded
  await loadMembersData()
})

/**
 * Handle organization name input changes
 * Updates the draft state in the store
 */
function handleNameChange(event: Event): void {
  const target = event.target as HTMLInputElement
  organizationStore.setDraftOrgName(target.value)
}

/**
 * Handle organization description textarea changes
 * Updates the draft state in the store
 */
function handleDescriptionChange(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  organizationStore.setDraftOrgDescription(target.value)
}

/**
 * Save the organization settings changes
 * Calls the store method to persist the changes
 */
async function saveSettings(): Promise<void> {
  if (orgId.value) {
    await organizationStore.saveOrgSettingsChanges(orgId.value)
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
