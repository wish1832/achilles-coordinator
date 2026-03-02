<template>
  <div class="pairing-view">
    <!-- Screen reader live region for announcements -->
    <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
      {{ srAnnouncement }}
    </div>

    <!-- Header -->
    <header class="pairing-header">
      <div class="pairing-header__content">
        <!-- Title row mirrors RunView's layout: title on left, actions button on right -->
        <div class="pairing-header__title-row">
          <h1 class="pairing-title">Manage Pairing Groups</h1>

          <!-- Actions dropdown menu -->
          <div class="actions-dropdown" :class="{ 'actions-dropdown--open': isActionsMenuOpen }">
            <AchillesButton
              :ref="(el) => setActionsMenuTriggerRef(el)"
              variant="secondary"
              size="small"
              aria-haspopup="menu"
              :aria-expanded="isActionsMenuOpen"
              aria-controls="actions-dropdown-menu"
              @click="toggleActionsMenu"
              @keydown="handleActionsMenuTriggerKeydown"
            >
              Actions
              <font-awesome-icon icon="caret-down" aria-hidden="true" />
            </AchillesButton>

            <ul
              v-show="isActionsMenuOpen"
              id="actions-dropdown-menu"
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
                @click="handleActionsMenuSelect('add-athlete')"
                @mouseenter="actionsMenuActiveIndex = 0"
              >
                Add User
              </li>
              <li
                role="menuitem"
                class="actions-dropdown__item"
                :class="{ 'actions-dropdown__item--active': actionsMenuActiveIndex === 1 }"
                tabindex="-1"
                @click="handleActionsMenuSelect('help')"
                @mouseenter="actionsMenuActiveIndex = 1"
              >
                Help
              </li>
            </ul>
          </div>
        </div>

        <p v-if="organization && run" class="pairing-subtitle">
          {{ organization.name }}
        </p>
        <p v-if="organization && run" class="pairing-subtitle">
          <b>{{ formatRunDate(run.date) }} at {{ run.time }}</b>
        </p>
      </div>
    </header>

    <!-- Main content -->
    <main id="main-content" class="pairing-main">
      <div class="pairing-container">
        <!-- Loading state -->
        <LoadingUI
          v-if="loading === 'loading'"
          type="spinner"
          centered
          text="Loading pairing data..."
        />

        <!-- Error state -->
        <div v-else-if="loading === 'error'" class="error-state">
          <h2>Error Loading Pairings</h2>
          <p>{{ error }}</p>
          <ButtonUI variant="primary" @click="retryLoad">Try Again</ButtonUI>
        </div>

        <!-- Success state -->
        <div v-else-if="loading === 'success'">
          <!-- Help modal for pairing instructions -->
          <PairingHelpModal
            :is-open="isInstructionsModalOpen"
            @close="isInstructionsModalOpen = false"
          />

          <!-- Add User drawer: slides in from the right to add org members to the run -->
          <AddUserDrawer
            :is-open="isAddUserDrawerOpen"
            :org-members="orgMembers"
            :signed-up-user-ids="signedUpUserIds"
            :adding-user-id="addingUserId"
            :recently-added-user-ids="recentlyAddedUserIds"
            @close="closeAddUserDrawer"
            @add-user="addUserToRun"
          />

          <!-- Pairing columns -->
          <section class="pairing-columns-section" aria-labelledby="pairings-heading">
            <h2 id="pairings-heading" class="sr-only">Athletes and Guides</h2>

            <!-- Actions bar (sort, help, save) -->
            <PairingActionsBar
              :sort-direction="sortDirection"
              :has-unsaved-changes="hasUnsavedChanges"
              :saving-pairings="savingPairings"
              :has-save-error="hasSaveError"
              @update:sort-direction="sortDirection = $event"
              @open-help="isInstructionsModalOpen = true"
              @save-pairings="savePairings"
            />

            <!-- Two-column layout: athletes and guides -->
            <div class="pairing-columns">
              <PairingAthleteColumn
                :athletes="athletes"
                :selected-athlete-id="selectedAthleteId"
                :paired-users="getPairedUsers"
                :formatted-pace="getFormattedPaceForUser"
                @select-athlete="selectAthlete"
                @unpair-user="unpairUserFromAthlete"
                @keydown-navigate="handleAthleteNavigationKeydown"
              />

              <PairingGuideColumn
                :guides="unpairedGuides"
                :total-guides="guides.length"
                :selected-guide-id="selectedGuideId"
                :selected-athlete-id="selectedAthleteId"
                :formatted-pace="getFormattedPaceForUser"
                :get-guide-card-style="getGuideCardStyle"
                :get-guide-compatibility-label="getGuideCompatibilityLabel"
                @select-guide="selectGuide"
                @keydown-navigate="handleGuideNavigationKeydown"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Core Vue imports
import { ref, computed, onMounted, onActivated, onBeforeUnmount, nextTick, toRaw } from 'vue'
import { useRoute } from 'vue-router'

// Store imports
import { useOrganizationStore } from '@/stores/organization'
import { useRunsStore } from '@/stores/runs'
import { useSignUpsStore } from '@/stores/signups'
import { useUsersStore } from '@/stores/users'

// Type imports
import type { User, LoadingState } from '@/types'

// Composable imports
import { usePairingLogic } from '@/composables/usePairingLogic'

// UI Component imports
import AchillesButton from '@/components/ui/AchillesButton.vue'
import ButtonUI from '@/components/ui/ButtonUI.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import PairingActionsBar from '@/components/pairing/PairingActionsBar.vue'
import PairingAthleteColumn from '@/components/pairing/PairingAthleteColumn.vue'
import PairingGuideColumn from '@/components/pairing/PairingGuideColumn.vue'
import PairingHelpModal from '@/components/pairing/PairingHelpModal.vue'
import AddUserDrawer from '@/components/pairing/AddUserDrawer.vue'

// Route access
const route = useRoute()

// Extract run ID from route parameters
const runId = computed(() => route.params.id as string)

// Initialize stores
const organizationStore = useOrganizationStore()
const runsStore = useRunsStore()
const signupsStore = useSignUpsStore()
const usersStore = useUsersStore()

// ==========================================
// Loading and Error States
// ==========================================

const loading = ref<LoadingState>('idle')
const error = ref<string | null>(null)
const savingPairings = ref(false)
const hasSaveError = ref(false)

// ==========================================
// Pairing State
// ==========================================

const selectedAthleteId = ref<string | null>(null)
const selectedGuideId = ref<string | null>(null)
const pairings = ref<Record<string, { guides: string[]; athletes: string[] }>>({})
const originalPairings = ref<Record<string, { guides: string[]; athletes: string[] }>>({})

// Screen reader announcement
const srAnnouncement = ref('')

// Modal state for "How to Pair" instructions
const isInstructionsModalOpen = ref(false)

// ==========================================
// Add User Drawer State
// ==========================================

// Whether the Add User drawer is visible
const isAddUserDrawerOpen = ref(false)

// ID of the user currently being added (drives the loading spinner on their row)
const addingUserId = ref<string | null>(null)

// Set of user IDs that were added during the current drawer session.
// Cleared each time the drawer is opened so "Added" badges only appear for
// users added in the current session, not from prior opens.
const recentlyAddedUserIds = ref<Set<string>>(new Set())

// Sorting state
const sortDirection = ref<'asc' | 'desc'>('desc')

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
// Initialize Pairing Logic Composable
// ==========================================

const {
  selectAthlete,
  selectGuide,
  unpairUserFromAthlete,
  clearSelection,
  getPairedUsers,
  getGuideCardStyle,
  getGuideCompatibilityLabel,
  getFormattedPaceForUser,
} = usePairingLogic(
  runId,
  pairings,
  originalPairings,
  selectedAthleteId,
  selectedGuideId,
  announceToScreenReader,
)

// ==========================================
// Computed Properties
// ==========================================

/**
 * Get the current organization from the store
 */
const organization = computed(() => {
  if (!run.value) return undefined
  return organizationStore.getOrganizationById(run.value.organizationId)
})

/**
 * Get the current run from the store
 */
const run = computed(() => runsStore.currentRun)

/**
 * Get athletes who signed up for the run
 * Excludes athletes paired with other athletes
 * Results are sorted by pace
 */
const athletes = computed(() => {
  const athleteSignUps = signupsStore
    .getSignUpsForRun(runId.value)
    .filter((s) => s.role === 'athlete' && (s.status === 'yes' || s.status === 'maybe'))

  const allAthletes = athleteSignUps
    .map((s) => usersStore.getUserById(s.userId))
    .filter((u) => u !== undefined) as User[]

  // Get set of athlete IDs that are paired with other athletes
  const pairedAthleteIds = new Set<string>()
  for (const pairing of Object.values(pairings.value)) {
    for (const athleteId of pairing.athletes) {
      pairedAthleteIds.add(athleteId)
    }
  }

  // Filter out athletes who have been paired with other athletes
  const filteredAthletes = allAthletes.filter((athlete) => !pairedAthleteIds.has(athlete.id))

  // Sort by pace
  return sortByPace(filteredAthletes)
})

/**
 * Get guides who signed up for the run
 * Results are sorted by pace
 */
const guides = computed(() => {
  const guideSignUps = signupsStore
    .getSignUpsForRun(runId.value)
    .filter((s) => s.role === 'guide' && (s.status === 'yes' || s.status === 'maybe'))

  const allGuides = guideSignUps
    .map((s) => usersStore.getUserById(s.userId))
    .filter((u) => u !== undefined) as User[]

  return sortByPace(allGuides)
})

/**
 * Get only unpaired guides for the right column
 */
const unpairedGuides = computed(() => {
  return guides.value.filter((guide) => !isGuidePaired(guide.id))
})

/**
 * Check if there are unsaved changes
 */
const hasUnsavedChanges = computed(
  () => JSON.stringify(pairings.value) !== JSON.stringify(originalPairings.value),
)

/**
 * All athletes in the organization, sorted alphabetically by display name.
 * Used to populate the Athletes section of the Add User drawer.
 */
const orgAthletes = computed(() => {
  const memberIds = organization.value?.memberIds ?? []
  return memberIds
    .map((id) => usersStore.getUserById(id))
    .filter((user): user is User => user !== undefined && user.role === 'athlete')
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

/**
 * All guides in the organization, sorted alphabetically by display name.
 * Used to populate the Guides section of the Add User drawer.
 */
const orgGuides = computed(() => {
  const memberIds = organization.value?.memberIds ?? []
  return memberIds
    .map((id) => usersStore.getUserById(id))
    .filter((user): user is User => user !== undefined && user.role === 'guide')
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

/**
 * Combined list of all org members (athletes first, then guides).
 * Passed to AddUserDrawer which handles the role-based splitting internally.
 */
const orgMembers = computed(() => [...orgAthletes.value, ...orgGuides.value])

/**
 * Set of user IDs that already have a sign-up record for this run.
 * Used by AddUserDrawer to mark already-signed-up users as disabled.
 */
const signedUpUserIds = computed(
  () => new Set(signupsStore.getSignUpsForRun(runId.value).map((s) => s.userId)),
)

// ==========================================
// Utility Functions
// ==========================================

/**
 * Check if a guide is currently paired with any athlete
 */
function isGuidePaired(guideId: string): boolean {
  return Object.values(pairings.value).some((pairing) => pairing.guides.includes(guideId))
}

/**
 * Convert a pace object to a decimal number for comparison
 */
function paceToDecimal(pace: { minutes: number; seconds: number } | undefined): number | undefined {
  if (!pace) return undefined
  return pace.minutes + pace.seconds / 60
}

/**
 * Sort users by their signup pace for the current run
 */
function sortByPace<T extends User>(users: T[]): T[] {
  return [...users].sort((a, b) => {
    const paceA = getSignupPace(a.id)
    const paceB = getSignupPace(b.id)

    const decimalA = paceToDecimal(paceA)
    const decimalB = paceToDecimal(paceB)

    // Users without pace go to the end
    if (decimalA === undefined && decimalB === undefined) return 0
    if (decimalA === undefined) return 1
    if (decimalB === undefined) return -1

    // Ascending: slowest first (higher numbers first)
    // Descending: fastest first (lower numbers first)
    if (sortDirection.value === 'asc') {
      return decimalB - decimalA
    } else {
      return decimalA - decimalB
    }
  })
}

/**
 * Get the pace from a user's signup for the current run
 */
function getSignupPace(userId: string): { minutes: number; seconds: number } | undefined {
  const signups = signupsStore.getSignUpsForRun(runId.value)
  const signup = signups.find((s) => s.userId === userId)
  return signup?.pace
}

/**
 * Announce a message to screen readers via ARIA live region
 */
function announceToScreenReader(message: string): void {
  srAnnouncement.value = message
  // Clear after a short delay so the same message can be announced again
  setTimeout(() => {
    srAnnouncement.value = ''
  }, 1000)
}

/**
 * Format a date for display
 */
function formatRunDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Retry loading data after an error
 */
function retryLoad(): void {
  loadData()
}

// ==========================================
// Navigation Handlers (from child components)
// ==========================================

/**
 * Handle navigation keydown from athlete column (Escape key)
 */
function handleAthleteNavigationKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    clearSelection()
  }
}

/**
 * Handle navigation keydown from guide column (Escape key)
 */
function handleGuideNavigationKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    clearSelection()
  }
}

// ==========================================
// Data Loading
// ==========================================

/**
 * Load all required data for the pairing interface
 */
async function loadData(): Promise<void> {
  try {
    loading.value = 'loading'
    error.value = null

    // Load the run details first
    await runsStore.loadRun(runId.value)

    if (!run.value) {
      throw new Error('Run not found')
    }

    // Load the organization if not cached
    if (!organization.value) {
      await organizationStore.loadOrganization(run.value.organizationId)
    }

    // Load all sign-ups for this run
    await signupsStore.loadSignUpsForRun(runId.value)

    // Get all unique user IDs from sign-ups
    const signUps = signupsStore.getSignUpsForRun(runId.value)
    const userIds = [...new Set(signUps.map((s) => s.userId))]

    // Load all user details in parallel
    await Promise.all(userIds.map((id) => usersStore.loadUser(id)))

    // Load all org member profiles so the Add User drawer can display everyone,
    // not just those who have already signed up for this run
    const memberIds = organization.value?.memberIds ?? []
    await usersStore.loadUsers(memberIds)

    // Initialize local pairings state from the run's saved pairings
    const savedPairings = run.value?.pairings || {}
    pairings.value = JSON.parse(JSON.stringify(savedPairings))
    originalPairings.value = JSON.parse(JSON.stringify(savedPairings))

    loading.value = 'success'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load pairing data'
    loading.value = 'error'
  }
}

// ==========================================
// Save Functionality
// ==========================================

/**
 * Save the current pairings to the database
 */
async function savePairings(): Promise<void> {
  try {
    savingPairings.value = true
    error.value = null
    hasSaveError.value = false

    // Deep copy the pairings to plain object
    const plainPairings = JSON.parse(JSON.stringify(pairings.value))

    // Update the run document with the new pairings
    await runsStore.savePairings(runId.value, plainPairings)

    // Update original pairings to mark as saved
    originalPairings.value = JSON.parse(JSON.stringify(pairings.value))

    announceToScreenReader('Pairings saved successfully')
  } catch (err) {
    console.error('✗ Error saving pairings:', err)
    hasSaveError.value = true
    error.value = err instanceof Error ? err.message : 'Failed to save pairings'
    announceToScreenReader('Error saving pairings')
  } finally {
    savingPairings.value = false
  }
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
      const keys: Array<'add-athlete' | 'help'> = ['add-athlete', 'help']
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
function handleActionsMenuSelect(action: 'add-athlete' | 'help'): void {
  closeActionsMenu()
  if (action === 'help') {
    isInstructionsModalOpen.value = true
  } else if (action === 'add-athlete') {
    // Clear any "Added" badges from the previous session before opening
    recentlyAddedUserIds.value = new Set()
    isAddUserDrawerOpen.value = true
  }
}

/**
 * Close the Add User drawer. Called when the user presses the X, clicks the
 * backdrop, or presses Escape. Clears the recently-added set so badges don't
 * linger if the drawer is reopened later.
 */
function closeAddUserDrawer(): void {
  isAddUserDrawerOpen.value = false
  recentlyAddedUserIds.value = new Set()
}

/**
 * Add an org member to the current run by creating a sign-up record for them.
 *
 * The sign-up is created with status 'yes' and activity 'run'. If the user has
 * a default pace set on their profile it is copied to the sign-up so they appear
 * in the correct position in the pairing columns.
 *
 * @param userId - The ID of the user to add
 */
async function addUserToRun(userId: string): Promise<void> {
  const user = usersStore.getUserById(userId)
  if (!user || !run.value) return

  // Show the loading spinner on this user's row while the request is in flight
  addingUserId.value = userId

  try {
    // Use the user's first preferred activity as the default, falling back to 'run'
    const defaultActivity = user.profileDetails.activities?.[0] ?? 'run'

    await signupsStore.createOrUpdateSignUp({
      runId: runId.value,
      userId,
      role: user.role,
      status: 'yes',
      activity: defaultActivity,
      // Copy the user's default pace to the sign-up if they have one defined.
      // toRaw strips Vue reactivity so structuredClone in the mock doesn't fail.
      pace: user.profileDetails.pace ? toRaw(user.profileDetails.pace) : undefined,
      timestamp: new Date(),
    })

    // Mark this user as added in the current drawer session so the drawer
    // can show the "Added" badge on their row
    recentlyAddedUserIds.value = new Set(recentlyAddedUserIds.value).add(userId)

    announceToScreenReader(`${user.displayName} added to run`)
  } catch {
    announceToScreenReader(`Failed to add ${user.displayName}`)
  } finally {
    addingUserId.value = null
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
// Lifecycle
// ==========================================

/**
 * Load data when component is first mounted
 */
onMounted(() => {
  loadData()
  document.addEventListener('click', handleActionsMenuClickOutside, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleActionsMenuClickOutside, true)
})

/**
 * Reload data each time the component is re-activated after navigation
 */
onActivated(() => {
  loadData()
})
</script>

<style scoped>
/* ==========================================
   Main Layout
   ========================================== */

.pairing-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ==========================================
   Header
   ========================================== */

.pairing-header {
  padding: 2rem 0;
}

.pairing-header__content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Title row: heading on the left, Actions button on the right */
.pairing-header__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
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

.pairing-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text, #111827);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.pairing-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

/* ==========================================
   Main Content
   ========================================== */

.pairing-main {
  padding: 2rem 0;
}

.pairing-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ==========================================
   Error State
   ========================================== */

.error-state {
  text-align: center;
  padding: 3rem 1rem;
}

.error-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-danger, #dc3545);
  margin: 0 0 1rem 0;
}

.error-state p {
  font-size: 1rem;
  color: var(--color-text, #111827);
  margin: 0 0 1.5rem 0;
}

/* ==========================================
   Pairing Columns Section
   ========================================== */

.pairing-columns-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pairing-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* ==========================================
   Text Size Support
   ========================================== */

.text-size-small .pairing-title {
  font-size: 2rem;
}

.text-size-small .pairing-subtitle {
  font-size: 1.125rem;
}

.text-size-large .pairing-title {
  font-size: 3rem;
}

.text-size-large .pairing-subtitle {
  font-size: 1.375rem;
}

.text-size-extra-large .pairing-title {
  font-size: 3.5rem;
}

.text-size-extra-large .pairing-subtitle {
  font-size: 1.5rem;
}

/* ==========================================
   High Contrast Mode
   ========================================== */

.high-contrast .pairing-header {
  border-bottom: 2px solid var(--color-text, #000000);
}

/* ==========================================
   Mobile Responsiveness
   ========================================== */

@media (max-width: 1024px) {
  .pairing-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .pairing-title {
    font-size: 2rem;
  }

  .pairing-subtitle {
    font-size: 1.125rem;
  }
}

@media (max-width: 640px) {
  .pairing-header {
    padding: 1.5rem 0;
  }

  .pairing-main {
    padding: 1.5rem 0;
  }

  .pairing-container {
    padding: 0 0.5rem;
  }

  .pairing-title {
    font-size: 1.75rem;
  }
}
</style>
