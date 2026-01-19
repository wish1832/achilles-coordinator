<template>
  <div class="pairing-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Screen reader live region for announcements -->
    <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
      {{ srAnnouncement }}
    </div>

    <!-- Header -->
    <header class="pairing-header">
      <div class="pairing-header__content">
        <h1 class="pairing-title">Manage Pairings</h1>
        <p v-if="organization && run" class="pairing-subtitle">
          {{ organization.name }} - {{ formatRunDate(run.date) }} at {{ run.time }}
        </p>
      </div>
    </header>

    <!-- Main content -->
    <main id="main-content" class="pairing-main">
      <div class="pairing-container">
        <!-- Loading state -->
        <LoadingUI v-if="loading === 'loading'" type="spinner" centered text="Loading pairing data..." />

        <!-- Error state -->
        <div v-else-if="loading === 'error'" class="error-state">
          <h2>Error Loading Pairings</h2>
          <p>{{ error }}</p>
          <ButtonUI variant="primary" @click="retryLoad">Try Again</ButtonUI>
        </div>

        <!-- Success state -->
        <div v-else-if="loading === 'success'">
          <!-- Instructions section -->
          <section class="pairing-instructions" aria-labelledby="instructions-heading">
            <h2 id="instructions-heading">How to Pair</h2>
            <CardUI>
              <ol class="instructions-list">
                <li>Click or press Enter/Space on an athlete, then click a guide to create a pairing</li>
                <li>Or, click or press Enter/Space on a guide, then click an athlete to create a pairing</li>
                <li>Athletes can be paired with multiple guides</li>
                <li>Press Escape to clear your selection</li>
                <li>Use Arrow Up/Down to navigate between cards in a column</li>
                <li>Use Home/End to jump to the first or last card in a column</li>
                <li>Click "Unpair" on a guide sub-card to remove that specific pairing</li>
                <li>Click "Save Pairings" to save your changes</li>
              </ol>
            </CardUI>
          </section>

          <!-- Save section with unsaved changes indicator -->
          <section class="pairing-actions" aria-labelledby="actions-heading">
            <h2 id="actions-heading" class="sr-only">Actions</h2>
            <div class="actions-bar">
              <div class="actions-status">
                <span v-if="hasUnsavedChanges" class="unsaved-indicator">
                  Unsaved changes
                </span>
                <span v-else class="saved-indicator">All changes saved</span>
              </div>
              <ButtonUI
                variant="primary"
                :disabled="!hasUnsavedChanges || savingPairings"
                :loading="savingPairings"
                @click="savePairings"
              >
                Save Pairings
              </ButtonUI>
            </div>
          </section>

          <!-- Pairing columns -->
          <section class="pairing-columns-section" aria-labelledby="pairings-heading">
            <h2 id="pairings-heading" class="sr-only">Athletes and Guides</h2>

            <div class="pairing-columns">
              <!-- Athletes column -->
              <div class="pairing-column athletes-column">
                <h3 class="column-heading">Athletes ({{ athletes.length }})</h3>

                <!-- No athletes message -->
                <div v-if="athletes.length === 0" class="empty-message">
                  <p>No athletes have signed up for this run yet.</p>
                </div>

                <!-- Athletes list -->
                <div v-else class="cards-list">
                  <div
                    v-for="(athlete, index) in athletes"
                    :key="athlete.id"
                    :ref="(el) => setAthleteCardRef(el, index)"
                    class="person-card-wrapper athlete-card-wrapper"
                    :class="{
                      'is-selected': selectedAthleteId === athlete.id,
                      'is-paired': getPairedGuides(athlete.id).length > 0,
                    }"
                    role="button"
                    tabindex="0"
                    :aria-label="`Athlete: ${athlete.displayName}${getPairedGuides(athlete.id).length > 0 ? `, paired with ${getPairedGuides(athlete.id).length} guide${getPairedGuides(athlete.id).length > 1 ? 's' : ''}` : ', not paired'}${selectedAthleteId === athlete.id ? ', selected' : ''}`"
                    @click="selectAthlete(athlete.id)"
                    @keydown="handleAthleteKeydown($event, athlete.id, index)"
                  >
                    <CardUI class="person-card athlete-card">
                      <div class="person-card__content">
                        <div class="person-info">
                          <h4 class="person-name">{{ athlete.displayName }}</h4>
                          <p v-if="athlete.profileDetails.preferredPace" class="person-detail">
                            Pace: {{ athlete.profileDetails.preferredPace }} min/mile
                          </p>
                          <p v-if="athlete.profileDetails.activities?.length" class="person-detail">
                            Activities: {{ athlete.profileDetails.activities.join(', ') }}
                          </p>
                        </div>

                        <!-- Pairing status -->
                        <div class="pairing-status">
                          <!-- Paired guides section -->
                          <div v-if="getPairedGuides(athlete.id).length > 0" class="paired-guides-section">
                            <span class="paired-label">Paired with:</span>

                            <!-- Individual guide sub-cards -->
                            <div class="paired-guides-list">
                              <div
                                v-for="guide in getPairedGuides(athlete.id)"
                                :key="guide.id"
                                class="paired-guide-card"
                              >
                                <div class="paired-guide-header">
                                  <h5 class="paired-guide-name">{{ guide.displayName }}</h5>
                                  <ButtonUI
                                    variant="danger"
                                    size="small"
                                    :aria-label="`Unpair ${athlete.displayName} from ${guide.displayName}`"
                                    @click.stop="unpairGuideFromAthlete(athlete.id, guide.id)"
                                    @keydown="handleUnpairKeydown($event, athlete.id, guide.id)"
                                  >
                                    Unpair
                                  </ButtonUI>
                                </div>
                                <div class="paired-guide-info">
                                  <p
                                    v-if="guide.profileDetails.preferredPace"
                                    class="paired-guide-detail"
                                  >
                                    Pace: {{ guide.profileDetails.preferredPace }} min/mile
                                  </p>
                                  <p
                                    v-if="guide.profileDetails?.activities?.length"
                                    class="paired-guide-detail"
                                  >
                                    Activities: {{ guide.profileDetails?.activities?.join(', ') }}
                                  </p>
                                  <p
                                    v-if="guide.profileDetails?.certifications?.length"
                                    class="paired-guide-detail certification"
                                  >
                                    <span class="certification-badge">✓</span>
                                    {{ guide.profileDetails?.certifications?.join(', ') }}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Not paired message -->
                          <div v-else class="unpaired">
                            <span class="unpaired-label">Not paired</span>
                          </div>
                        </div>

                        <!-- Selection indicator -->
                        <div v-if="selectedAthleteId === athlete.id" class="selection-indicator">
                          <span class="selection-badge">Selected</span>
                        </div>
                      </div>
                    </CardUI>
                  </div>
                </div>
              </div>

              <!-- Guides column -->
              <div class="pairing-column guides-column">
                <h3 class="column-heading">Unpaired Guides ({{ unpairedGuides.length }})</h3>

                <!-- No guides message -->
                <div v-if="unpairedGuides.length === 0" class="empty-message">
                  <p>
                    {{
                      guides.length === 0
                        ? 'No guides have signed up for this run yet.'
                        : 'All guides are currently paired.'
                    }}
                  </p>
                </div>

                <!-- Guides list -->
                <div v-else class="cards-list">
                  <div
                    v-for="(guide, index) in unpairedGuides"
                    :key="guide.id"
                    :ref="(el) => setGuideCardRef(el, index)"
                    class="person-card-wrapper guide-card-wrapper"
                    :class="{
                      'is-selected': selectedGuideId === guide.id,
                    }"
                    role="button"
                    tabindex="0"
                    :aria-label="`Guide: ${guide.displayName}, available${selectedGuideId === guide.id ? ', selected' : ''}. ${selectedAthleteId ? 'Press Enter or Space to pair with selected athlete' : ''}`"
                    @click="selectGuide(guide.id)"
                    @keydown="handleGuideKeydown($event, guide.id, index)"
                  >
                    <CardUI class="person-card guide-card">
                      <div class="person-card__content">
                        <div class="person-info">
                          <h4 class="person-name">{{ guide.displayName }}</h4>
                          <p v-if="guide.profileDetails.preferredPace" class="person-detail">
                            Pace: {{ guide.profileDetails.preferredPace }} min/mile
                          </p>
                          <p v-if="guide.profileDetails.activities?.length" class="person-detail">
                            Activities: {{ guide.profileDetails.activities.join(', ') }}
                          </p>
                          <p
                            v-if="guide.profileDetails.certifications?.length"
                            class="person-detail certification"
                          >
                            <span class="certification-badge">✓</span>
                            {{ guide.profileDetails.certifications.join(', ') }}
                          </p>
                        </div>

                        <!-- Pairing status badge -->
                        <div class="pairing-badge">
                          <span class="badge available-badge">Available</span>
                        </div>

                        <!-- Selection indicator -->
                        <div v-if="selectedGuideId === guide.id" class="selection-indicator">
                          <span class="selection-badge">Selected</span>
                        </div>
                      </div>
                    </CardUI>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
// Core Vue imports
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// Store imports
import { useOrganizationStore } from '@/stores/organization'
import { useRunsStore } from '@/stores/runs'
import { useSignUpsStore } from '@/stores/signups'
import { useUsersStore } from '@/stores/users'
import { useDataRepository } from '@/composables/useRepositories'

// Type imports
import type { User, LoadingState } from '@/types'

// UI Component imports
import CardUI from '@/components/ui/CardUI.vue'
import ButtonUI from '@/components/ui/ButtonUI.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'

// Route access
const route = useRoute()

// Extract route parameters as computed properties
// These represent the organization ID and run ID from the URL
const orgId = computed(() => route.params.orgId as string)
const runId = computed(() => route.params.runId as string)

// Initialize stores
const organizationStore = useOrganizationStore()
const runsStore = useRunsStore()
const signupsStore = useSignUpsStore()
const usersStore = useUsersStore()
const dataRepository = useDataRepository()

// Loading and error states
// Track the overall loading state of the page data
const loading = ref<LoadingState>('idle')
const error = ref<string | null>(null)
const savingPairings = ref(false)

// Pairing state
// selectedAthleteId: The currently selected athlete (for pairing)
// selectedGuideId: The currently selected guide (for pairing)
// pairings: Local copy of pairings that can be modified before saving
// originalPairings: The saved state from the database, used to detect unsaved changes
const selectedAthleteId = ref<string | null>(null)
const selectedGuideId = ref<string | null>(null)
const pairings = ref<Record<string, string[]>>({}) // athleteId -> array of guideIds mapping
const originalPairings = ref<Record<string, string[]>>({})


// Screen reader announcement
// This string is announced to screen readers via an ARIA live region
const srAnnouncement = ref('')

// Refs for card elements to enable keyboard navigation
// These arrays store references to DOM elements for athlete and guide cards
const athleteCardRefs = ref<(HTMLElement | null)[]>([])
const guideCardRefs = ref<(HTMLElement | null)[]>([])

/**
 * Set reference to an athlete card element
 * Called by Vue's ref function for each athlete card
 */
function setAthleteCardRef(el: unknown, index: number): void {
  if (el instanceof HTMLElement) {
    athleteCardRefs.value[index] = el
  } else {
    athleteCardRefs.value[index] = null
  }
}

/**
 * Set reference to a guide card element
 * Called by Vue's ref function for each guide card
 */
function setGuideCardRef(el: unknown, index: number): void {
  if (el instanceof HTMLElement) {
    guideCardRefs.value[index] = el
  } else {
    guideCardRefs.value[index] = null
  }
}

// ==========================================
// Computed Properties
// ==========================================

/**
 * Get the current organization from the store
 * The organization should be loaded by the router guard before reaching this component
 */
const organization = computed(() => organizationStore.getOrganizationById(orgId.value))

/**
 * Get the current run from the store
 * This contains all run details including existing pairings
 */
const run = computed(() => runsStore.currentRun)

/**
 * Get athletes who signed up for the run
 * Filters sign-ups for active athlete sign-ups and maps to User objects
 */
const athletes = computed(() => {
  const athleteSignUps = signupsStore
    .getSignUpsForRun(runId.value)
    .filter((s) => s.role === 'athlete' && s.status === 'active')

  return athleteSignUps
    .map((s) => usersStore.getUserById(s.userId))
    .filter((u) => u !== undefined) as User[]
})

/**
 * Get guides who signed up for the run
 * Filters sign-ups for active guide sign-ups and maps to User objects
 */
const guides = computed(() => {
  const guideSignUps = signupsStore
    .getSignUpsForRun(runId.value)
    .filter((s) => s.role === 'guide' && s.status === 'active')

  return guideSignUps
    .map((s) => usersStore.getUserById(s.userId))
    .filter((u) => u !== undefined) as User[]
})

/**
 * Get only unpaired guides for the right column
 * Filters out guides who are already paired with an athlete
 */
const unpairedGuides = computed(() => {
  return guides.value.filter((guide) => !isGuidePaired(guide.id))
})

/**
 * Check if there are unsaved changes
 * Compares current pairings state with original pairings from database
 */
const hasUnsavedChanges = computed(
  () => JSON.stringify(pairings.value) !== JSON.stringify(originalPairings.value),
)

/**
 * Get all guides paired with a specific athlete
 * Returns empty array if athlete is not paired
 */
function getPairedGuides(athleteId: string): User[] {
  const guideIds = pairings.value[athleteId] || []
  return guideIds
    .map((guideId) => usersStore.getUserById(guideId))
    .filter((user) => user !== undefined) as User[]
}

/**
 * Check if a guide is currently paired with any athlete
 */
function isGuidePaired(guideId: string): boolean {
  return Object.values(pairings.value).some((guideIds) => guideIds.includes(guideId))
}

/**
 * Get all athletes paired with a specific guide
 * Returns array of athletes (can be multiple with new system)
 */
function getAthletesForGuide(guideId: string): User[] {
  const athleteIds = Object.keys(pairings.value).filter((athleteId) => {
    const guides = pairings.value[athleteId]
    return guides && guides.includes(guideId)
  })
  return athleteIds
    .map((athleteId) => usersStore.getUserById(athleteId))
    .filter((user) => user !== undefined) as User[]
}

// ==========================================
// Data Loading
// ==========================================

/**
 * Load all required data for the pairing interface
 * This includes: organization, run, sign-ups, and user details
 */
async function loadData(): Promise<void> {
  try {
    loading.value = 'loading'
    error.value = null

    // Load organization (should already be cached from router guard)
    if (!organization.value) {
      await organizationStore.loadOrganization(orgId.value)
    }

    // Load the run details
    await runsStore.loadRun(runId.value)

    // Verify run belongs to organization (security check)
    if (run.value?.organizationId !== orgId.value) {
      throw new Error('Run does not belong to this organization')
    }

    // Load all sign-ups for this run
    await signupsStore.loadSignUpsForRun(runId.value)

    // Get all unique user IDs from sign-ups
    const signUps = signupsStore.getSignUpsForRun(runId.value)
    const userIds = [...new Set(signUps.map((s) => s.userId))]

    // Load all user details in parallel for better performance
    await Promise.all(userIds.map((id) => usersStore.loadUser(id)))

    // Initialize local pairings state from the run's saved pairings
    // We need to create a deep copy because pairings now contains arrays
    // A shallow copy would share array references, breaking unsaved changes detection
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
// Pairing Actions
// ==========================================

/**
 * Select an athlete
 * If a guide is already selected, creates the pairing immediately
 * Otherwise, marks the athlete as selected
 */
function selectAthlete(athleteId: string): void {
  // If a guide is already selected, create the pairing
  if (selectedGuideId.value) {
    createPairing(athleteId, selectedGuideId.value)
    return
  }

  // Otherwise, select the athlete
  selectedAthleteId.value = athleteId
  const athleteName = usersStore.getUserById(athleteId)?.displayName
  announceToScreenReader(`Selected athlete: ${athleteName}. Now select a guide to create pairing.`)
}

/**
 * Select a guide
 * If an athlete is already selected, creates the pairing immediately
 * Otherwise, marks the guide as selected
 */
function selectGuide(guideId: string): void {
  // If an athlete is already selected, create the pairing
  if (selectedAthleteId.value) {
    createPairing(selectedAthleteId.value, guideId)
    return
  }

  // Otherwise, select the guide
  selectedGuideId.value = guideId
  const guideName = usersStore.getUserById(guideId)?.displayName
  announceToScreenReader(`Selected guide: ${guideName}. Now select an athlete to create pairing.`)
}

/**
 * Create a pairing between an athlete and guide
 * Adds guide to athlete's array of guides
 */
function createPairing(athleteId: string, guideId: string): void {
  // Initialize array if athlete has no pairings yet
  if (!pairings.value[athleteId]) {
    pairings.value[athleteId] = []
  }

  // Check if this specific pairing already exists
  if (pairings.value[athleteId].includes(guideId)) {
    announceToScreenReader('This pairing already exists')
    selectedAthleteId.value = null
    selectedGuideId.value = null
    return
  }

  // Add the guide to the athlete's pairings
  pairings.value[athleteId].push(guideId)

  const athleteName = usersStore.getUserById(athleteId)?.displayName
  const guideName = usersStore.getUserById(guideId)?.displayName
  announceToScreenReader(`Paired ${athleteName} with ${guideName}`)

  // Clear both selections after successful pairing
  selectedAthleteId.value = null
  selectedGuideId.value = null
}

/**
 * Remove a specific guide from an athlete's pairings
 */
function unpairGuideFromAthlete(athleteId: string, guideId: string): void {
  // Get the current pairings for this athlete
  const guidesArray = pairings.value[athleteId]
  if (!guidesArray) return

  // Remove the specific guide from the array
  const index = guidesArray.indexOf(guideId)
  if (index > -1) {
    guidesArray.splice(index, 1)
  }

  // If no more guides for this athlete, remove the entry entirely
  if (guidesArray.length === 0) {
    delete pairings.value[athleteId]
  }

  const athleteName = usersStore.getUserById(athleteId)?.displayName
  const guideName = usersStore.getUserById(guideId)?.displayName
  announceToScreenReader(`Unpaired ${athleteName} from ${guideName}`)
}

/**
 * Clear the current athlete and guide selection
 */
function clearSelection(): void {
  selectedAthleteId.value = null
  selectedGuideId.value = null
  announceToScreenReader('Selection cleared')
}

// ==========================================
// Save Functionality
// ==========================================

/**
 * Save the current pairings to the database
 * Updates the run document with the new pairings object
 */
async function savePairings(): Promise<void> {
  try {
    savingPairings.value = true
    error.value = null

    // Update the run document with the new pairings
    await dataRepository.updateRun(runId.value, {
      pairings: pairings.value,
    })

    // Update original pairings to mark as saved
    originalPairings.value = { ...pairings.value }

    announceToScreenReader('Pairings saved successfully')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save pairings'
    announceToScreenReader('Error saving pairings')
  } finally {
    savingPairings.value = false
  }
}

// ==========================================
// Keyboard Navigation
// ==========================================

/**
 * Focus a card element at a specific index in a list
 * Handles bounds checking and announces navigation to screen readers
 */
function focusCard(cardRefs: (HTMLElement | null)[], index: number, listName: string): void {
  // Ensure index is within bounds
  if (index < 0 || index >= cardRefs.length) return

  // Get the card element and focus it
  const card = cardRefs[index]
  if (card) {
    card.focus()
    // Announce to screen reader: position in list
    const position = `${index + 1} of ${cardRefs.length}`
    announceToScreenReader(`${listName} ${position}`)
  }
}

/**
 * Handle keyboard events on athlete cards
 * Enter/Space: Select athlete
 * ArrowUp/ArrowDown: Navigate between athlete cards
 * Home: Jump to first athlete
 * End: Jump to last athlete
 * Escape: Clear selection
 */
function handleAthleteKeydown(event: KeyboardEvent, athleteId: string, currentIndex: number): void {
  // Handle Enter and Space for selection
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectAthlete(athleteId)
    return
  }

  // Handle Escape to clear selection
  if (event.key === 'Escape') {
    event.preventDefault()
    clearSelection()
    return
  }

  // Handle arrow key navigation
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    // Move to previous athlete card
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      focusCard(athleteCardRefs.value, prevIndex, 'Athlete')
    }
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    // Move to next athlete card
    const nextIndex = currentIndex + 1
    if (nextIndex < athletes.value.length) {
      focusCard(athleteCardRefs.value, nextIndex, 'Athlete')
    }
    return
  }

  // Handle Home key - jump to first card
  if (event.key === 'Home') {
    event.preventDefault()
    focusCard(athleteCardRefs.value, 0, 'Athlete')
    return
  }

  // Handle End key - jump to last card
  if (event.key === 'End') {
    event.preventDefault()
    const lastIndex = athletes.value.length - 1
    focusCard(athleteCardRefs.value, lastIndex, 'Athlete')
    return
  }
}

/**
 * Handle keyboard events on guide cards
 * Enter/Space: Select guide (or pair if athlete already selected)
 * ArrowUp/ArrowDown: Navigate between guide cards
 * Home: Jump to first guide
 * End: Jump to last guide
 * Escape: Clear selection
 */
function handleGuideKeydown(event: KeyboardEvent, guideId: string, currentIndex: number): void {
  // Handle Enter and Space for selecting guide
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectGuide(guideId)
    return
  }

  // Handle Escape to clear selection
  if (event.key === 'Escape') {
    event.preventDefault()
    clearSelection()
    return
  }

  // Handle arrow key navigation
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    // Move to previous guide card
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      focusCard(guideCardRefs.value, prevIndex, 'Guide')
    }
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    // Move to next guide card
    const nextIndex = currentIndex + 1
    if (nextIndex < guides.value.length) {
      focusCard(guideCardRefs.value, nextIndex, 'Guide')
    }
    return
  }

  // Handle Home key - jump to first card
  if (event.key === 'Home') {
    event.preventDefault()
    focusCard(guideCardRefs.value, 0, 'Guide')
    return
  }

  // Handle End key - jump to last card
  if (event.key === 'End') {
    event.preventDefault()
    const lastIndex = guides.value.length - 1
    focusCard(guideCardRefs.value, lastIndex, 'Guide')
    return
  }
}

/**
 * Handle keyboard events on unpair buttons
 * Enter/Space: Unpair specific guide from athlete
 * Stops propagation to prevent triggering the parent card's click handler
 */
function handleUnpairKeydown(event: KeyboardEvent, athleteId: string, guideId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    unpairGuideFromAthlete(athleteId, guideId)
  }
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Announce a message to screen readers via ARIA live region
 * The message is cleared after 1 second to allow the same message to be announced again
 */
function announceToScreenReader(message: string): void {
  srAnnouncement.value = message
  // Clear after a short delay so the same message can be announced again
  setTimeout(() => {
    srAnnouncement.value = ''
  }, 1000)
}

/**
 * Retry loading data after an error
 */
function retryLoad(): void {
  loadData()
}

/**
 * Format a date for display
 * Converts Date object to readable string
 */
function formatRunDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ==========================================
// Lifecycle
// ==========================================

/**
 * Load data when component is mounted
 */
onMounted(() => {
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

/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary, #0066cc);
  color: white;
  padding: 0.5rem 1rem;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}

/* ==========================================
   Header
   ========================================== */

.pairing-header {
  background: linear-gradient(
    135deg,
    var(--color-primary, #0066cc) 0%,
    var(--color-primary-hover, #0052a3) 100%
  );
  color: white;
  padding: 2rem 0;
}

.pairing-header__content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.pairing-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.pairing-subtitle {
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
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
   Instructions Section
   ========================================== */

.pairing-instructions h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0 0 1rem 0;
}

.instructions-list {
  margin: 0;
  padding: 1rem 1rem 1rem 2.5rem;
  list-style-type: decimal;
}

.instructions-list li {
  font-size: 1rem;
  color: var(--color-text, #111827);
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.instructions-list li:last-child {
  margin-bottom: 0;
}

/* ==========================================
   Actions Bar (Save section)
   ========================================== */

.pairing-actions {
  /* Contained by actions-bar */
}

.actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.actions-status {
  font-size: 0.875rem;
  font-weight: 500;
}

.unsaved-indicator {
  color: var(--color-warning, #ffc107);
}

.saved-indicator {
  color: var(--color-success, #28a745);
}

/* ==========================================
   Pairing Columns
   ========================================== */

.pairing-columns-section {
  /* Container for columns */
}

.pairing-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.pairing-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.column-heading {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  padding: 0 0 0.5rem 0;
  border-bottom: 2px solid var(--color-border, #e5e7eb);
}

/* ==========================================
   Person Cards (Athletes and Guides)
   ========================================== */

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.person-card-wrapper {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  cursor: pointer;
  border-radius: 0.5rem;
}

.person-card-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: var(
    --shadow-lg,
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05)
  );
}

.person-card-wrapper:focus {
  outline: 3px solid var(--color-primary, #0066cc);
  outline-offset: 2px;
}

/* Selected state for athlete cards */
.athlete-card-wrapper.is-selected {
  border: 2px solid var(--color-primary, #0066cc);
  background-color: var(--color-primary-light, #e6f2ff);
}

/* Selected state for guide cards */
.guide-card-wrapper.is-selected {
  border: 2px solid var(--color-primary, #0066cc);
  background-color: var(--color-primary-light, #e6f2ff);
}

/* Paired state visual indicator */
.person-card-wrapper.is-paired {
  background-color: var(--color-success-light, #f0f9f4);
}

.person-card {
  height: 100%;
}

.person-card__content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.person-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.person-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.3;
}

.person-detail {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

.person-detail.certification {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-success, #28a745);
  font-weight: 500;
}

.certification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  background-color: var(--color-success, #28a745);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
}

/* ==========================================
   Pairing Status (in athlete cards)
   ========================================== */

.pairing-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Paired guides section */
.paired-guides-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.paired-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-success, #28a745);
}

/* List of paired guide sub-cards */
.paired-guides-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Individual paired guide sub-card */
.paired-guide-card {
  padding: 0.75rem;
  background-color: var(--color-success-light, #f0f9f4);
  border-radius: 0.375rem;
  border: 1px solid var(--color-success, #28a745);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.paired-guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.paired-guide-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.paired-guide-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.3;
}

.paired-guide-detail {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

.paired-guide-detail.certification {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-success, #28a745);
  font-weight: 500;
}

.unpaired {
  padding: 0.5rem;
  text-align: center;
}

.unpaired-label {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  font-style: italic;
}

/* ==========================================
   Selection Indicator (athlete cards)
   ========================================== */

.selection-indicator {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.selection-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--color-primary, #0066cc);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 9999px;
}

/* ==========================================
   Pairing Badge (guide cards)
   ========================================== */

.pairing-badge {
  display: flex;
  justify-content: center;
}

.badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.375rem;
}

.paired-badge {
  background-color: var(--color-warning-light, #fff3cd);
  color: var(--color-warning-dark, #856404);
  border: 1px solid var(--color-warning, #ffc107);
}

.available-badge {
  background-color: var(--color-success-light, #f0f9f4);
  color: var(--color-success-dark, #155724);
  border: 1px solid var(--color-success, #28a745);
}

/* ==========================================
   Empty Message
   ========================================== */

.empty-message {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-message p {
  font-size: 1rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
}

/* ==========================================
   Modal Actions
   ========================================== */

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
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
  background: var(--color-primary, #000000);
}

.high-contrast .person-card-wrapper {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .athlete-card-wrapper.is-selected {
  border: 3px solid var(--color-primary, #000000);
}

/* ==========================================
   Reduced Motion Support
   ========================================== */

.reduced-motion .person-card-wrapper {
  transition: none;
}

.reduced-motion .person-card-wrapper:hover {
  transform: none;
}

/* ==========================================
   Mobile Responsiveness
   ========================================== */

@media (max-width: 1024px) {
  .pairing-columns {
    grid-template-columns: 1fr;
  }

  .column-heading {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .pairing-title {
    font-size: 2rem;
  }

  .pairing-subtitle {
    font-size: 1.125rem;
  }

  .actions-bar {
    flex-direction: column;
    align-items: stretch;
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
