<template>
  <div class="run-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Header -->
    <header class="run-header">
      <div class="run-header__content">
        <div class="run-header__title-row">
          <h1 class="run-title">{{ locationName }}</h1>
          <!-- Actions dropdown menu - only visible to users who can manage this run -->
          <div
            v-if="canUserManageRun"
            class="actions-dropdown"
            :class="{ 'actions-dropdown--open': isActionsMenuOpen }"
          >
            <AchillesButton
              :ref="(el) => setActionsMenuTriggerRef(el)"
              variant="secondary"
              size="small"
              aria-haspopup="menu"
              :aria-expanded="isActionsMenuOpen"
              aria-controls="run-actions-dropdown-menu"
              @click="toggleActionsMenu"
              @keydown="handleActionsMenuTriggerKeydown"
            >
              Actions
              <font-awesome-icon icon="caret-down" aria-hidden="true" />
            </AchillesButton>

            <ul
              v-show="isActionsMenuOpen"
              id="run-actions-dropdown-menu"
              ref="actionsMenuRef"
              role="menu"
              class="actions-dropdown__menu"
              tabindex="-1"
              @keydown="handleActionsMenuKeydown"
            >
              <li
                role="menuitem"
                class="actions-dropdown__item"
                :class="{ 'actions-dropdown__item--active': actionsMenuActiveIndex === 0 }"
                tabindex="-1"
                @click="handleActionsMenuSelect('edit-run')"
                @mouseenter="actionsMenuActiveIndex = 0"
              >
                Edit Run
              </li>
              <li
                role="menuitem"
                class="actions-dropdown__item actions-dropdown__item--danger"
                :class="{ 'actions-dropdown__item--active': actionsMenuActiveIndex === 1 }"
                tabindex="-1"
                @click="handleActionsMenuSelect('delete-run')"
                @mouseenter="actionsMenuActiveIndex = 1"
              >
                Delete Run
              </li>
            </ul>
          </div>
        </div>
        <p v-if="organizationName" class="run-subtitle">{{ organizationName }}</p>
      </div>
    </header>

    <!-- Success toast shown after saving run edits -->
    <div
      v-if="showSuccessToast"
      class="success-toast"
      role="status"
      aria-live="polite"
    >
      <font-awesome-icon icon="circle-check" aria-hidden="true" class="success-toast__icon" />
      <span class="success-toast__message">Run updated successfully</span>
      <button
        class="success-toast__dismiss"
        aria-label="Dismiss notification"
        @click="dismissToast"
      >
        &times;
      </button>
    </div>

    <!-- Main content -->
    <main id="main-content" class="run-main">
      <div class="run-content">
        <!-- Loading state -->
        <LoadingUI
          v-if="loading === 'loading'"
          type="spinner"
          text="Loading run details..."
          centered
        />

        <!-- Error state -->
        <div v-else-if="loading === 'error'" class="run-error">
          <h2>Unable to load run details</h2>
          <p>{{ 'Please try again and contact us if the problem persists.' }}</p>
          <AchillesButton @click="loadRunData">Try Again</AchillesButton>
        </div>

        <!-- Run details -->
        <div v-else-if="runsStore.currentRun" class="run-details-container">
          <CardUI class="run-details-card" title="Run Details">
            <!-- Date and Time -->
            <div class="detail-section">
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">{{ formatDate(runsStore.currentRun.date) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">{{ runsStore.currentRun.time }}</span>
              </div>
            </div>

            <!-- Run Admins -->
            <div class="detail-section">
              <h3 class="subsection-title">Run Organizers:</h3>
              <p v-if="isAdminUsersLoading && adminIds.length > 0" class="no-data">
                Loading organizers...
              </p>
              <ul v-else-if="adminNames.length > 0" class="admin-list">
                <li v-for="(name, index) in adminNames" :key="index" class="admin-item">
                  {{ name }}
                </li>
              </ul>
              <p v-else class="no-data">No organizers assigned</p>
            </div>

            <!-- Location Details -->
            <div class="detail-section">
              <h3 class="subsection-title">Location Details</h3>
              <div v-if="location" class="location-details">
                <div v-if="location.notes" class="detail-row location-notes">
                  <span class="detail-value">{{ location.notes }}</span>
                </div>
                <div v-if="location.address" class="detail-row">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value">{{ location.address }}</span>
                </div>
                <div v-if="location.city || location.state" class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">
                    {{ location.city }}<template v-if="location.city && location.state">, </template
                    >{{ location.state }}
                  </span>
                </div>
              </div>
              <p v-else class="no-data">Location information not available</p>
            </div>

            <!-- Sign-up Actions -->
            <div class="run-actions">
              <!-- Show "signed up!" message if user already signed up, otherwise show "Sign Up" button -->
              <template v-if="isUserSignedUp">
                <div class="signup-status">
                  <p class="signup-status__message">Signed up!</p>
                  <a href="#" class="signup-status__link" @click.prevent="openEditRSVPModal"> edit RSVP </a>
                </div>
              </template>
              <AchillesButton v-else variant="primary" size="medium" @click="openSignUpModal">
                Sign Up
              </AchillesButton>

              <!-- Manage Pairings button - only visible to run admins -->
              <AchillesButton
                v-if="canUserManageRun"
                variant="secondary"
                size="medium"
                class="manage-pairings-button"
                @click="navigateToPairings"
              >
                Manage Pairings
              </AchillesButton>
            </div>
          </CardUI>
        </div>

        <!-- Not found state -->
        <div v-else class="run-error">
          <h2>Run not found</h2>
          <p>The run you're looking for doesn't exist or has been removed.</p>
          <AchillesButton @click="router.push('/dashboard')">Back to Dashboard</AchillesButton>
        </div>
      </div>
    </main>

    <!-- Delete Run Confirmation Modal -->
    <ModalElement
      :is-open="isDeleteRunModalOpen"
      title="Delete Run"
      size="small"
      @close="closeDeleteRunModal"
    >
      <p>Are you sure you want to delete this run?</p>
      <p class="modal-warning">
        Warning! This action can't be undone. All sign-ups and pairings associated with this run
        will be permanently lost.
      </p>
      <template #footer>
        <div class="modal-actions">
          <AchillesButton
              :ref="(el) => setDeleteCancelRef(el)"
              variant="secondary"
              @click="closeDeleteRunModal"
            >
              Cancel
            </AchillesButton>
          <AchillesButton
            variant="danger"
            :disabled="isDeletingRun"
            @click="confirmDeleteRun"
          >
            {{ isDeletingRun ? 'Deleting...' : 'Delete Run' }}
          </AchillesButton>
        </div>
      </template>
    </ModalElement>

    <!-- RSVP Modal -->
    <RSVPModal
      :is-open="isRSVPModalOpen"
      :run="runsStore.currentRun"
      :location-name="locationName"
      :is-editing="isEditingRSVP"
      :existing-sign-up="existingSignUpData"
      @update:is-open="isRSVPModalOpen = $event"
      @close="closeRSVPModal"
      @submitted="handleRSVPSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import ModalElement from '@/components/ui/ModalElement.vue'
import RSVPModal from '@/components/RSVPModal.vue'
import { useRunsStore } from '@/stores/runs'
import { useLocationStore } from '@/stores/location'
import { useOrganizationStore } from '@/stores/organization'
import { useSignUpsStore } from '@/stores/signups'
import { useAuthStore } from '@/stores/auth'
import { useAdminCapabilities } from '@/composables/useAdminCapabilities'
import { useUsersByIdsQuery } from '@/composables/queries/useUsersByIdsQuery'
import type { Location, LoadingState } from '@/types'

// Router and stores
const router = useRouter()
const route = useRoute()
const runsStore = useRunsStore()
const locationStore = useLocationStore()
const organizationStore = useOrganizationStore()
const signUpsStore = useSignUpsStore()
const authStore = useAuthStore()
const { canManageRun } = useAdminCapabilities()

// Local state for tracking loading and errors
const loading = ref<LoadingState>('idle')
const error = ref<string | null>(null)

// RSVP Modal state
const isRSVPModalOpen = ref(false)
const isEditingRSVP = ref(false)

// ==========================================
// Actions Dropdown State
// ==========================================

const isActionsMenuOpen = ref(false)
const actionsMenuActiveIndex = ref(-1)
const actionsMenuItemCount = 2

const actionsMenuTriggerRef = ref<HTMLButtonElement | null>(null)
const actionsMenuRef = ref<HTMLUListElement | null>(null)

/**
 * Set the reference to the AchillesButton's underlying button element
 */
function setActionsMenuTriggerRef(el: unknown): void {
  if (el && typeof el === 'object' && '$el' in el) {
    actionsMenuTriggerRef.value = (el as Record<string, unknown>).$el as HTMLButtonElement
  } else if (el instanceof HTMLButtonElement) {
    actionsMenuTriggerRef.value = el
  } else {
    actionsMenuTriggerRef.value = null
  }
}

// ==========================================
// Delete Run Modal State
// ==========================================

const isDeleteRunModalOpen = ref(false)
const isDeletingRun = ref(false)
const deleteCancelRef = ref<HTMLButtonElement | null>(null)

/**
 * Set the reference to the Cancel button's underlying element inside the delete modal.
 * Uses the same pattern as setActionsMenuTriggerRef to unwrap AchillesButton.
 */
function setDeleteCancelRef(el: unknown): void {
  if (el && typeof el === 'object' && '$el' in el) {
    deleteCancelRef.value = (el as Record<string, unknown>).$el as HTMLButtonElement
  } else if (el instanceof HTMLButtonElement) {
    deleteCancelRef.value = el
  } else {
    deleteCancelRef.value = null
  }
}

// Focus the Cancel button when the delete modal opens so that the
// dangerous action is not the default keyboard target.
watch(isDeleteRunModalOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      deleteCancelRef.value?.focus()
    })
  }
})

// Success toast state — shown after navigating back from a successful edit
const showSuccessToast = ref(false)
let toastDismissTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Dismiss the success toast and clear the auto-dismiss timer.
 */
function dismissToast(): void {
  showSuccessToast.value = false
  if (toastDismissTimer) {
    clearTimeout(toastDismissTimer)
    toastDismissTimer = null
  }
}

// Get the run ID from the route parameter
const runId = computed(() => route.params.id as string)

// Computed properties

// Get the location for the current run
const location = computed((): Location | undefined => {
  if (!runsStore.currentRun) return undefined
  return locationStore.getLocationById(runsStore.currentRun.locationId)
})

// Get the location name from the loaded location
const locationName = computed(() => location.value?.name || 'Unknown Location')

// Get the organization for the current run
const organization = computed(() => {
  if (!runsStore.currentRun) return undefined
  return organizationStore.getOrganizationById(runsStore.currentRun.organizationId)
})

// Get the organization name from the loaded organization
const organizationName = computed(() => organization.value?.name || 'Unknown Organization')

// Get the list of admin IDs for this run
const adminIds = computed(() => {
  return Array.from(
    new Set([
      ...(runsStore.currentRun?.runAdminIds ?? []),
      ...(organization.value?.adminIds ?? []),
    ]),
  )
})

const adminUsersQuery = useUsersByIdsQuery(adminIds)
const isAdminUsersLoading = computed(() => adminUsersQuery.isPending.value)

// Get the display names of the admins
const adminNames = computed(() => {
  return (adminUsersQuery.data.value ?? []).map((user) => user.displayName)
})

// Check if the current user can manage this run (is org admin or run admin)
const canUserManageRun = computed(() => {
  if (!runsStore.currentRun) return false
  return canManageRun(runsStore.currentRun.organizationId, runsStore.currentRun.runAdminIds)
})

// Check if the current user has signed up for this run
const isUserSignedUp = computed(() => {
  // If no user is logged in, they cannot be signed up
  if (!authStore.currentUser) {
    return false
  }

  // Get all sign-ups for this run
  const signUps = signUpsStore.getSignUpsForRun(runId.value)

  // Check if any sign-up with status 'yes' or 'maybe' belongs to the current user
  return signUps.some(
    (signup) => signup.userId === authStore.currentUser!.id && (signup.status === 'yes' || signup.status === 'maybe'),
  )
})

// Computed: Get existing sign-up data for editing
const existingSignUpData = computed(() => {
  if (!runsStore.currentRun || !authStore.currentUser || !isEditingRSVP.value) {
    return undefined
  }

  // Find the user's sign-up for this run
  const signUps = signUpsStore.getSignUpsForRun(runId.value)
  const userSignUp = signUps.find(
    (signup) => signup.userId === authStore.currentUser!.id && (signup.status === 'yes' || signup.status === 'maybe'),
  )

  if (!userSignUp) {
    return undefined
  }

  return {
    status: userSignUp.status,
    activity: userSignUp.activity,
    pace: userSignUp.pace,
  }
})

// Helper function to format date for display
function formatDate(date: Date): string {
  const runDate = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return runDate.toLocaleDateString('en-US', options)
}

// Load all data for the run
async function loadRunData(): Promise<void> {
  try {
    loading.value = 'loading'
    error.value = null

    // Load the run by ID using the runs store
    await runsStore.loadRun(runId.value)

    // Check if the run was loaded successfully
    if (!runsStore.currentRun) {
      // Run not found
      loading.value = 'success'
      return
    }

    // Load the location for this run
    await locationStore.loadLocation(runsStore.currentRun.locationId)

    // Load the organization for this run
    await organizationStore.loadOrganization(runsStore.currentRun.organizationId)

    // Load sign-ups for this run
    await signUpsStore.loadSignUpsForRun(runId.value)

    loading.value = 'success'
    lastLoadedRunId = runId.value
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load run details'
    loading.value = 'error'
    console.error('Error loading run data:', err)
  }
}

/**
 * Open the RSVP modal for signing up to a run
 */
function openSignUpModal(): void {
  isEditingRSVP.value = false
  isRSVPModalOpen.value = true
}

/**
 * Open the RSVP modal for editing an existing sign-up
 */
function openEditRSVPModal(): void {
  isEditingRSVP.value = true
  isRSVPModalOpen.value = true
}

/**
 * Close the RSVP modal
 */
function closeRSVPModal(): void {
  isRSVPModalOpen.value = false
  isEditingRSVP.value = false
}

/**
 * Handle successful RSVP submission
 * The modal handles the actual sign-up creation/update, we just need to close it
 */
function handleRSVPSubmitted(): void {
  closeRSVPModal()
}

// ==========================================
// Actions Dropdown Functions
// ==========================================

/**
 * Open the Actions dropdown and focus the menu element
 */
function openActionsMenu(): void {
  isActionsMenuOpen.value = true
  actionsMenuActiveIndex.value = 0
  nextTick(() => {
    actionsMenuRef.value?.focus()
  })
}

/**
 * Close the Actions dropdown and return focus to the trigger button
 */
function closeActionsMenu(): void {
  isActionsMenuOpen.value = false
  actionsMenuActiveIndex.value = -1
  actionsMenuTriggerRef.value?.focus()
}

/**
 * Toggle the Actions dropdown open or closed
 */
function toggleActionsMenu(): void {
  if (isActionsMenuOpen.value) {
    closeActionsMenu()
  } else {
    openActionsMenu()
  }
}

/**
 * Handle keyboard events on the Actions trigger button
 */
function handleActionsMenuTriggerKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
    case ' ':
    case 'Enter':
      event.preventDefault()
      openActionsMenu()
      break
    case 'Escape':
      if (isActionsMenuOpen.value) {
        event.preventDefault()
        closeActionsMenu()
      }
      break
  }
}

/**
 * Handle keyboard navigation inside the Actions dropdown menu
 */
function handleActionsMenuKeydown(event: KeyboardEvent): void {
  const lastIndex = actionsMenuItemCount - 1

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      actionsMenuActiveIndex.value =
        actionsMenuActiveIndex.value < lastIndex ? actionsMenuActiveIndex.value + 1 : 0
      break
    case 'ArrowUp':
      event.preventDefault()
      actionsMenuActiveIndex.value =
        actionsMenuActiveIndex.value > 0 ? actionsMenuActiveIndex.value - 1 : lastIndex
      break
    case 'Home':
      event.preventDefault()
      actionsMenuActiveIndex.value = 0
      break
    case 'End':
      event.preventDefault()
      actionsMenuActiveIndex.value = lastIndex
      break
    case 'Enter':
    case ' ': {
      event.preventDefault()
      const keys: Array<'edit-run' | 'delete-run'> = ['edit-run', 'delete-run']
      const key = keys[actionsMenuActiveIndex.value]
      if (key) handleActionsMenuSelect(key)
      break
    }
    case 'Escape':
      event.preventDefault()
      closeActionsMenu()
      break
    case 'Tab':
      closeActionsMenu()
      break
  }
}

/**
 * Handle selection of an item from the Actions dropdown
 */
function handleActionsMenuSelect(action: 'edit-run' | 'delete-run'): void {
  closeActionsMenu()
  if (action === 'edit-run') {
    navigateToEditRun()
  } else if (action === 'delete-run') {
    isDeleteRunModalOpen.value = true
  }
}

/**
 * Close the Actions dropdown when the user clicks outside of it
 */
function handleActionsMenuClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement

  if (
    isActionsMenuOpen.value &&
    !actionsMenuTriggerRef.value?.contains(target) &&
    !actionsMenuRef.value?.contains(target)
  ) {
    closeActionsMenu()
  }
}

// ==========================================
// Delete Run Functions
// ==========================================

/**
 * Close the delete run confirmation modal
 */
function closeDeleteRunModal(): void {
  isDeleteRunModalOpen.value = false
}

/**
 * Confirm and execute run deletion.
 * Deletes the run via the store, then navigates to the dashboard.
 */
async function confirmDeleteRun(): Promise<void> {
  if (!runsStore.currentRun) return

  try {
    isDeletingRun.value = true
    await runsStore.deleteRun(runId.value)

    // Close the modal and reset state before navigating.
    // Because <KeepAlive> keeps this component alive, we must
    // explicitly clean up — otherwise the modal stays visible.
    isDeleteRunModalOpen.value = false
    isDeletingRun.value = false

    router.push('/dashboard')
  } catch (err) {
    console.error('Error deleting run:', err)
    isDeletingRun.value = false
  }
}

// Navigate to the edit run page
function navigateToEditRun(): void {
  if (!runsStore.currentRun) return
  router.push(`/organizations/${runsStore.currentRun.organizationId}/runs/${runId.value}/edit`)
}

// Navigate to the pairings management page for this run
function navigateToPairings(): void {
  if (!runsStore.currentRun) return
  router.push(`/organizations/${runsStore.currentRun.organizationId}/runs/${runId.value}/pairing`)
}

// Initialize on mount — load all run data and register click-outside listener
onMounted(() => {
  loadRunData()
  document.addEventListener('click', handleActionsMenuClickOutside, true)
})

// Track the last loaded run ID so we can detect when the route changes
// while the component is cached by <KeepAlive>.
let lastLoadedRunId: string | null = null

// Re-activate the component each time the user navigates to this view.
// With <KeepAlive>, onMounted only fires once; onActivated fires every time.
onActivated(() => {
  // Reload data if the route points to a different run than what was
  // previously loaded (e.g. navigating from run-1 to run-2).
  if (runId.value !== lastLoadedRunId) {
    loadRunData()
  }

  if (runsStore.editRunSaveSuccess) {
    showSuccessToast.value = true
    runsStore.editRunSaveSuccess = false
    toastDismissTimer = setTimeout(dismissToast, 8000)
  }
})

// Clean up timers and listeners when the component unmounts
onBeforeUnmount(() => {
  if (toastDismissTimer) {
    clearTimeout(toastDismissTimer)
  }
  document.removeEventListener('click', handleActionsMenuClickOutside, true)
})
</script>

<style scoped>
/* Main layout */
.run-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Header */
.run-header {
  padding: 2rem 0;
}

.run-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.run-header__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.run-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
  color: var(--color-text, #111827);
}

.run-subtitle {
  font-size: 1.25rem;
  font-weight: 400;
  margin: 0;
  line-height: 1.4;
  color: var(--color-text-muted, #6b7280);
}

/* Main content */
.run-main {
  padding: 2rem 0;
}

/* Run content shows run details, loading state, or error state */
.run-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Run details */
/* Containing element for run details card */
.run-details-container {
  padding: 1rem;
}

/* Detail sections */
.detail-section {
  margin-bottom: 0.5rem;
}

.detail-section:last-of-type {
  margin-bottom: 0;
}

.subsection-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--color-text, #111827);
}

/* Detail rows */
.detail-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: var(--color-text, #111827);
  min-width: 80px;
}

.detail-value {
  color: var(--color-text-muted, #6b7280);
}

/* Location notes can be longer, so allow them to wrap */
.location-notes {
  flex-direction: column;
  gap: 0.25rem;
}

.location-notes .detail-label {
  min-width: auto;
}

/* Admin list */
.admin-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.admin-item {
  color: var(--color-text-muted, #6b7280);
}

/* No data message */
.no-data {
  color: var(--color-text-muted, #6b7280);
  font-style: italic;
  margin: 0;
}

/* Sign-up Actions */
.run-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

/* Manage Pairings button positioned to the right */
.manage-pairings-button {
  margin-left: auto;
}

/* Signup status display - matches the style from RunsListView */
.signup-status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.signup-status__message {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-success, #059669);
  margin: 0;
}

.signup-status__link {
  font-size: 0.875rem;
  color: var(--color-primary, #0066cc);
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
}

.signup-status__link:hover {
  color: var(--color-primary-hover, #0052a3);
}

.signup-status__link:focus {
  outline: 2px solid var(--color-primary, #0066cc);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Error state */
.run-error {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.run-error h2 {
  color: var(--color-error, #dc2626);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.run-error p {
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
}

/* Text size support */
.text-size-small .run-title {
  font-size: 2rem;
}

.text-size-small .run-subtitle {
  font-size: 1.125rem;
}

.text-size-large .run-title {
  font-size: 3rem;
}

.text-size-large .run-subtitle {
  font-size: 1.375rem;
}

.text-size-extra-large .run-title {
  font-size: 3.5rem;
}

.text-size-extra-large .run-subtitle {
  font-size: 1.5rem;
}

/* High contrast mode */
.high-contrast .run-actions {
  border-top-color: var(--color-text, #000000);
}

.high-contrast .signup-status__message {
  color: var(--color-success, #047857);
}

.high-contrast .signup-status__link {
  color: var(--color-primary, #0066cc);
  text-decoration: underline;
  text-decoration-thickness: 2px;
}

/* Reduced motion support */
.reduced-motion .signup-status__link {
  transition: none;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .run-title {
    font-size: 2rem;
  }

  .run-subtitle {
    font-size: 1.125rem;
  }

  .run-details-card {
    padding: 1.5rem;
  }
}

@media (max-width: 640px) {
  .run-header {
    padding: 1.5rem 0;
  }

  .run-main {
    padding: 1.5rem 0;
  }

  .run-content {
    padding: 0 0.5rem;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    min-width: auto;
  }
}

/* Success toast */
.success-toast {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  max-width: 800px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  color: var(--color-success, #008b00);
  font-weight: 500;
  animation: toast-slide-down 0.3s ease-out;
}

.success-toast__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.success-toast__message {
  flex: 1;
}

.success-toast__dismiss {
  background: none;
  border: none;
  color: var(--color-success, #008b00);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.success-toast__dismiss:hover {
  background-color: #dcfce7;
}

@keyframes toast-slide-down {
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* High contrast mode */
.high-contrast .success-toast {
  background-color: #ffffff;
  border-color: var(--color-success, #008b00);
  border-width: 2px;
}

/* Reduced motion — no animation */
.reduced-motion .success-toast {
  animation: none;
}

/* ==========================================
   Actions Dropdown
   ========================================== */

.actions-dropdown {
  position: relative;
  display: inline-block;
}

.actions-dropdown__menu {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  z-index: 50;
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  min-width: 10rem;
  background-color: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.actions-dropdown__item {
  display: block;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text, #111827);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease-in-out;
}

.actions-dropdown__item:hover,
.actions-dropdown__item--active {
  background-color: var(--color-bg-hover, #f3f4f6);
}

/* Danger variant for destructive actions like Delete Run */
.actions-dropdown__item--danger {
  color: var(--color-error, #dc2626);
}

.actions-dropdown__item--danger:hover,
.actions-dropdown__item--danger.actions-dropdown__item--active {
  background-color: #fef2f2;
}

/* ==========================================
   Modal Styles
   ========================================== */

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
</style>
