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
        <div class="pairing-header__top-row">
          <h1 class="pairing-title">Manage Pairing Groups</h1>
          <!-- Help icon to open pairing instructions modal -->
          <button
            class="help-icon-button"
            aria-label="How to pair"
            @click="isInstructionsModalOpen = true"
          >
            <font-awesome-icon icon="circle-question" />
          </button>
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
          <!-- Instructions modal -->
          <ModalElement
            :is-open="isInstructionsModalOpen"
            title="How to Pair"
            size="large"
            @close="isInstructionsModalOpen = false"
          >
            <div class="instructions-content">
              <h3 class="instructions-subheading">Pairing Athletes with Guides</h3>
              <ol class="instructions-list">
                <li>
                  Click or press Enter/Space on an athlete, then click a guide to create a pairing
                </li>
                <li>
                  Or, click or press Enter/Space on a guide, then click an athlete to create a
                  pairing
                </li>
                <li>Athletes can be paired with multiple guides</li>
              </ol>

              <h3 class="instructions-subheading">Pairing Athletes Together</h3>
              <p class="instructions-paragraph">
                When guide availability is limited, multiple athletes may need to share one guide.
                To represent this, you can pair athletes together. The second athlete will be
                shown under the first athlete's pairings.
              </p>
              <p class="instructions-paragraph"><strong>To pair athletes together:</strong></p>
              <ul class="instructions-list">
                <li>
                  <strong>With mouse:</strong> Click the first athlete (who will keep their own
                  pairing entry), then click the second athlete (who will move under the first
                  athlete's card)
                </li>
                <li>
                  <strong>With keyboard:</strong> Press Enter or Space on the first athlete, then
                  press Enter or Space on the second athlete
                </li>
              </ul>
              <p class="instructions-paragraph">
                Athletes may also be paired together without a guide. You are responsible for
                determining whether such pairings are appropriate for the run.
              </p>

              <h3 class="instructions-subheading">Navigation & Actions</h3>
              <ul class="instructions-list">
                <li>Press Escape to clear your selection</li>
                <li>Use Arrow Up/Down to navigate between cards in a column</li>
                <li>Use Home/End to jump to the first or last card in a column</li>
                <li>Click "Unpair" on a sub-card to remove that specific pairing</li>
                <li>Click "Save Pairings" to save your changes</li>
              </ul>
            </div>
          </ModalElement>

          <!-- Pairing columns -->
          <section class="pairing-columns-section" aria-labelledby="pairings-heading">
            <h2 id="pairings-heading" class="sr-only">Athletes and Guides</h2>

            <!-- Sort controls and save actions on the same row -->
            <div class="sort-controls">
              <!-- Sort button on the left -->
              <ButtonUI
                variant="secondary"
                :aria-label="`Sort by pace, currently ${sortDirection === 'asc' ? 'slowest to fastest' : 'fastest to slowest'}. Click to toggle.`"
                @click="toggleSortDirection"
              >
                Pace
                <font-awesome-icon v-if="sortDirection === 'asc'" icon="caret-up" />
                <font-awesome-icon v-else icon="caret-down" />
              </ButtonUI>

              <!-- Save indicator and save button grouped on the right -->
              <div class="actions-save-group">
                <div class="actions-status">
                  <span v-if="hasUnsavedChanges" class="unsaved-indicator">Unsaved changes</span>
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
            </div>

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
                      'is-paired': getPairedUsers(athlete.id).length > 0,
                    }"
                    role="button"
                    tabindex="0"
                    :aria-label="`Athlete: ${athlete.displayName}${getPairedUsers(athlete.id).length > 0 ? `, paired with ${getPairedUsers(athlete.id).length} user${getPairedUsers(athlete.id).length > 1 ? 's' : ''}` : ', not paired'}${selectedAthleteId === athlete.id ? ', selected' : ''}`"
                    @click="selectAthlete(athlete.id)"
                    @keydown="handleAthleteKeydown($event, athlete.id, index)"
                  >
                    <CardUI class="person-card athlete-card">
                      <div class="person-card__content">
                        <div class="person-info">
                          <div class="person-name-wrapper">
                            <h4 class="person-name">{{ athlete.displayName }}</h4>
                            <span class="role-badge role-badge--athlete">Athlete</span>
                          </div>
                          <p v-if="getFormattedPaceForUser(athlete.id)" class="person-detail">
                            Pace: {{ getFormattedPaceForUser(athlete.id) }} min/mile
                          </p>
                          <p v-if="athlete.profileDetails.activities?.length" class="person-detail">
                            Activities: {{ athlete.profileDetails.activities.join(', ') }}
                          </p>
                        </div>

                        <!-- Pairing status -->
                        <div class="pairing-status">
                          <!-- Paired users section -->
                          <div
                            v-if="getPairedUsers(athlete.id).length > 0"
                            class="paired-guides-section"
                          >
                            <span class="paired-label">Paired with:</span>

                            <!-- Individual user sub-cards (guides and athletes) -->
                            <div class="paired-guides-list">
                              <div
                                v-for="user in getPairedUsers(athlete.id)"
                                :key="user.id"
                                class="paired-guide-card"
                              >
                                <div class="paired-guide-header">
                                  <div class="paired-guide-name-wrapper">
                                    <h5 class="paired-guide-name">{{ user.displayName }}</h5>
                                    <span class="role-badge" :class="`role-badge--${user.role}`">
                                      {{ user.role === 'guide' ? 'Guide' : 'Athlete' }}
                                    </span>
                                  </div>
                                  <ButtonUI
                                    variant="danger"
                                    size="small"
                                    :aria-label="`Unpair ${athlete.displayName} from ${user.role} ${user.displayName}`"
                                    @click.stop="unpairUserFromAthlete(athlete.id, user.id)"
                                    @keydown="handleUnpairKeydown($event, athlete.id, user.id)"
                                  >
                                    Unpair
                                  </ButtonUI>
                                </div>
                                <div class="paired-guide-info">
                                  <p
                                    v-if="getFormattedPaceForUser(user.id)"
                                    class="paired-guide-detail"
                                  >
                                    {{ user.role === 'guide' ? 'Max pace' : 'Pace' }}: {{ getFormattedPaceForUser(user.id) }} min/mile
                                  </p>
                                  <p
                                    v-if="user.profileDetails?.activities?.length"
                                    class="paired-guide-detail"
                                  >
                                    Activities: {{ user.profileDetails?.activities?.join(', ') }}
                                  </p>
                                  <p
                                    v-if="user.profileDetails?.certifications?.length"
                                    class="paired-guide-detail certification"
                                  >
                                    <span class="certification-badge">✓</span>
                                    {{ user.profileDetails?.certifications?.join(', ') }}
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
                    :aria-label="`Guide: ${guide.displayName}, available${getGuideCompatibilityLabel(guide.id)}${selectedGuideId === guide.id ? ', selected' : ''}. ${selectedAthleteId ? 'Press Enter or Space to pair with selected athlete' : ''}`"
                    @click="selectGuide(guide.id)"
                    @keydown="handleGuideKeydown($event, guide.id, index)"
                  >
                    <CardUI class="person-card guide-card" :style="getGuideCardStyle(guide.id)">
                      <div class="person-card__content">
                        <div class="person-info">
                          <div class="person-name-wrapper">
                            <h4 class="person-name">{{ guide.displayName }}</h4>
                            <span class="role-badge role-badge--guide">Guide</span>
                          </div>
                          <p v-if="getFormattedPaceForUser(guide.id)" class="person-detail">
                            Max pace: {{ getFormattedPaceForUser(guide.id) }} min/mile
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
import type { User, LoadingState, SignUp } from '@/types'

// UI Component imports
import CardUI from '@/components/ui/CardUI.vue'
import ButtonUI from '@/components/ui/ButtonUI.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import ModalElement from '@/components/ui/ModalElement.vue'


// Route access
const route = useRoute()

// Extract run ID from route parameters
// The organization ID is derived from the loaded run data rather than the URL
const runId = computed(() => route.params.id as string)

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
const pairings = ref<Record<string, { guides: string[]; athletes: string[] }>>({})
const originalPairings = ref<Record<string, { guides: string[]; athletes: string[] }>>({})

// Modal state for "How to Pair" instructions
const isInstructionsModalOpen = ref(false)

// Sorting state
// sortDirection: 'asc' means slowest to fastest (ascending pace values)
//                'desc' means fastest to slowest (descending pace values)
// Default to descending (fastest to slowest)
const sortDirection = ref<'asc' | 'desc'>('desc')

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
 * The organization ID is derived from the loaded run, rather than a URL parameter
 */
const organization = computed(() => {
  if (!run.value) return undefined
  return organizationStore.getOrganizationById(run.value.organizationId)
})

/**
 * Get the current run from the store
 * This contains all run details including existing pairings
 */
const run = computed(() => runsStore.currentRun)

/**
 * Get athletes who signed up for the run
 * Filters sign-ups for active athlete sign-ups and maps to User objects
 * Excludes athletes who are paired with other athletes (appearing in someone else's athletes array)
 * Results are sorted by pace according to current sortDirection
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
 * Filters sign-ups for guide sign-ups with status 'yes' or 'maybe' and maps to User objects
 * Results are sorted by pace according to current sortDirection
 */
const guides = computed(() => {
  const guideSignUps = signupsStore
    .getSignUpsForRun(runId.value)
    .filter((s) => s.role === 'guide' && (s.status === 'yes' || s.status === 'maybe'))

  const allGuides = guideSignUps
    .map((s) => usersStore.getUserById(s.userId))
    .filter((u) => u !== undefined) as User[]

  // Sort by pace
  return sortByPace(allGuides)
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
 * Get all users (guides and athletes) paired with a specific athlete
 * Returns empty array if athlete is not paired
 */
function getPairedUsers(athleteId: string): User[] {
  const pairing = pairings.value[athleteId]
  if (!pairing) return []

  // Combine both guides and athletes arrays
  const allUserIds = [...pairing.guides, ...pairing.athletes]
  return allUserIds
    .map((userId) => usersStore.getUserById(userId))
    .filter((user) => user !== undefined) as User[]
}

/**
 * Check if a guide is currently paired with any athlete
 */
function isGuidePaired(guideId: string): boolean {
  return Object.values(pairings.value).some((pairing) => pairing.guides.includes(guideId))
}

/**
 * Toggle the sort direction between ascending and descending
 * Ascending: slowest to fastest (higher pace numbers first)
 * Descending: fastest to slowest (lower pace numbers first)
 */
function toggleSortDirection(): void {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  const direction = sortDirection.value === 'asc' ? 'slowest to fastest' : 'fastest to slowest'
  announceToScreenReader(`Sorted by pace, ${direction}`)
}

/**
 * Convert a pace object to a decimal number for comparison.
 * For example, { minutes: 9, seconds: 30 } becomes 9.5
 * @param pace - The pace object with minutes and seconds
 * @returns Decimal pace value, or undefined if pace is not set
 */
function paceToDecimal(pace: { minutes: number; seconds: number } | undefined): number | undefined {
  if (!pace) return undefined
  return pace.minutes + pace.seconds / 60
}

/**
 * Sort users by their signup pace for the current run.
 * Users without a pace are placed at the end of the list.
 */
function sortByPace<T extends User>(users: T[]): T[] {
  return [...users].sort((a, b) => {
    // Get pace from signup data instead of user profile
    const paceA = paceToDecimal(getSignupPace(a.id))
    const paceB = paceToDecimal(getSignupPace(b.id))

    // Users without pace go to the end
    if (paceA === undefined && paceB === undefined) return 0
    if (paceA === undefined) return 1
    if (paceB === undefined) return -1

    // Ascending: slowest first (higher numbers first)
    // Descending: fastest first (lower numbers first)
    if (sortDirection.value === 'asc') {
      return paceB - paceA
    } else {
      return paceA - paceB
    }
  })
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

    // Load the run details first so we can derive the organization ID
    await runsStore.loadRun(runId.value)

    if (!run.value) {
      throw new Error('Run not found')
    }

    // Load the organization using the run's organizationId
    // May already be cached from the router guard
    if (!organization.value) {
      await organizationStore.loadOrganization(run.value.organizationId)
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
 * If the same athlete is already selected, deselects them
 * If a guide is already selected, creates the pairing immediately
 * If another athlete is already selected, creates an athlete-athlete pairing
 * Otherwise, marks the athlete as selected
 */
function selectAthlete(athleteId: string): void {
  // If clicking the same athlete that's already selected, deselect them
  if (selectedAthleteId.value === athleteId) {
    selectedAthleteId.value = null
    const athleteName = usersStore.getUserById(athleteId)?.displayName
    announceToScreenReader(`Deselected athlete: ${athleteName}`)
    return
  }

  // If a guide is already selected, create the pairing
  if (selectedGuideId.value) {
    createPairing(athleteId, selectedGuideId.value)
    return
  }

  // If another athlete is already selected, create athlete-athlete pairing
  // The currently clicked athlete (athleteId) keeps their own card in the main list
  // The previously selected athlete (selectedAthleteId.value) appears under this athlete's pairings
  if (selectedAthleteId.value && selectedAthleteId.value !== athleteId) {
    createPairing(athleteId, selectedAthleteId.value)
    return
  }

  // Otherwise, select the athlete
  selectedAthleteId.value = athleteId
  const athleteName = usersStore.getUserById(athleteId)?.displayName
  announceToScreenReader(
    `Selected athlete: ${athleteName}. Now select a guide or another athlete to create pairing.`,
  )
}

/**
 * Select a guide
 * If the same guide is already selected, deselects them
 * If an athlete is already selected, creates the pairing immediately
 * Otherwise, marks the guide as selected
 */
function selectGuide(guideId: string): void {
  // If clicking the same guide that's already selected, deselect them
  if (selectedGuideId.value === guideId) {
    selectedGuideId.value = null
    const guideName = usersStore.getUserById(guideId)?.displayName
    announceToScreenReader(`Deselected guide: ${guideName}`)
    return
  }

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
 * Validate if two users can be paired
 * Handles validation for both athlete-guide and athlete-athlete pairings
 */
function canPairUsers(athleteId: string, userId: string): { allowed: boolean; reason?: string } {
  // Prevent self-pairing
  if (athleteId === userId) {
    return { allowed: false, reason: 'Cannot pair athlete with themselves' }
  }

  // Get the user being paired
  const user = usersStore.getUserById(userId)
  if (!user) {
    return { allowed: false, reason: 'User not found' }
  }

  // Check if this specific pairing already exists
  const athletePairing = pairings.value[athleteId]
  if (athletePairing) {
    if (athletePairing.guides.includes(userId) || athletePairing.athletes.includes(userId)) {
      return { allowed: false, reason: 'This pairing already exists' }
    }
  }

  // If userId is a guide, allow pairing (existing behavior)
  if (user.role === 'guide') {
    return { allowed: true }
  }

  // userId is an athlete - check if they have actual pairings (not just an empty entry)
  const userPairing = pairings.value[userId]
  if (userPairing && (userPairing.guides.length > 0 || userPairing.athletes.length > 0)) {
    return { allowed: false, reason: 'This athlete already has their own pairings' }
  }

  // Check if userId appears in any other athlete's pairings
  for (const [otherId, pairing] of Object.entries(pairings.value)) {
    if (otherId !== athleteId) {
      if (pairing.athletes.includes(userId) || pairing.guides.includes(userId)) {
        return { allowed: false, reason: 'This athlete is already paired with another athlete' }
      }
    }
  }

  return { allowed: true }
}

/**
 * Create a pairing between an athlete and another user (guide or athlete)
 * Handles both athlete-guide and athlete-athlete pairings
 */
function createPairing(athleteId: string, userId: string): void {
  // Validate the pairing
  const validation = canPairUsers(athleteId, userId)
  if (!validation.allowed) {
    announceToScreenReader(validation.reason || 'Cannot create pairing')
    selectedAthleteId.value = null
    selectedGuideId.value = null
    return
  }

  // Initialize pairing structure if athlete has no pairings yet
  if (!pairings.value[athleteId]) {
    pairings.value[athleteId] = { guides: [], athletes: [] }
  }

  // Get the user being paired
  const user = usersStore.getUserById(userId)
  if (!user) {
    announceToScreenReader('User not found')
    selectedAthleteId.value = null
    selectedGuideId.value = null
    return
  }

  // If pairing with an athlete, clear their existing pairings
  if (user.role === 'athlete' && userId in pairings.value) {
    delete pairings.value[userId]
  }

  // Add the user to the appropriate array based on their role
  if (user.role === 'guide') {
    pairings.value[athleteId].guides.push(userId)
  } else {
    pairings.value[athleteId].athletes.push(userId)
  }

  const athleteName = usersStore.getUserById(athleteId)?.displayName
  const userName = user.displayName
  const userRoleLabel = user.role === 'guide' ? 'guide' : 'athlete'
  announceToScreenReader(`Paired athlete ${athleteName} with ${userRoleLabel} ${userName}`)

  // Clear both selections after successful pairing
  selectedAthleteId.value = null
  selectedGuideId.value = null
}

/**
 * Remove a specific user (guide or athlete) from an athlete's pairings
 */
function unpairUserFromAthlete(athleteId: string, userId: string): void {
  // Get the current pairings for this athlete
  const pairing = pairings.value[athleteId]
  if (!pairing) return

  // Get the user to determine their role
  const user = usersStore.getUserById(userId)
  if (!user) return

  // Remove the user from the appropriate array
  if (user.role === 'guide') {
    const index = pairing.guides.indexOf(userId)
    if (index > -1) {
      pairing.guides.splice(index, 1)
    }
  } else {
    // Athlete - remove from athletes array
    const index = pairing.athletes.indexOf(userId)
    if (index > -1) {
      pairing.athletes.splice(index, 1)
    }

    // Restore the athlete's own empty pairing entry
    pairings.value[userId] = { guides: [], athletes: [] }
  }

  // If no more guides or athletes for this athlete, remove the entry entirely
  if (pairing.guides.length === 0 && pairing.athletes.length === 0) {
    delete pairings.value[athleteId]
  }

  const athleteName = usersStore.getUserById(athleteId)?.displayName
  const userName = user.displayName
  const userRoleLabel = user.role === 'guide' ? 'guide' : 'athlete'
  announceToScreenReader(`Unpaired athlete ${athleteName} from ${userRoleLabel} ${userName}`)
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
    // Use deep copy to properly track changes since pairings contains nested arrays
    originalPairings.value = JSON.parse(JSON.stringify(pairings.value))

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
 * Enter/Space: Unpair specific user from athlete
 * Stops propagation to prevent triggering the parent card's click handler
 */
function handleUnpairKeydown(event: KeyboardEvent, athleteId: string, userId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    unpairUserFromAthlete(athleteId, userId)
  }
}

// ==========================================
// Pace Compatibility Functions
// ==========================================

// Severity levels for pace compatibility
// 'none' = no mismatch, 'slight' = minor concern, 'significant' = major concern
type PaceCompatibilitySeverity = 'none' | 'slight' | 'significant'

/**
 * Determines the severity of pace incompatibility between an athlete and a guide.
 * Now uses signup pace data (minutes and seconds) instead of profile pace.
 *
 * The logic varies based on the athlete's pace:
 * - For paces faster than or equal to 10 min/mile:
 *   - 'slight' if guide's max pace is 30 seconds to under 1 minute slower
 *   - 'significant' if guide's max pace is 1 minute or more slower
 * - For paces slower than 10 min/mile:
 *   - 'slight' if guide's max pace is 1 minute to under 2 minutes slower
 *   - 'significant' if guide's max pace is 2 minutes or more slower
 *
 * @param athletePace - The athlete's signup pace object
 * @param guidePace - The guide's signup pace object
 * @returns The severity level of the pace incompatibility
 */
function getPaceCompatibilitySeverity(
  athletePace: { minutes: number; seconds: number } | undefined,
  guidePace: { minutes: number; seconds: number } | undefined,
): PaceCompatibilitySeverity {
  // If either pace is not defined, no mismatch can be determined
  if (athletePace === undefined || guidePace === undefined) {
    return 'none'
  }

  // Convert pace objects to decimal values (in minutes per mile)
  const athletePaceNum = paceToDecimal(athletePace)
  const guidePaceNum = paceToDecimal(guidePace)

  // If conversion fails, no mismatch can be determined
  if (athletePaceNum === undefined || guidePaceNum === undefined) {
    return 'none'
  }

  // Calculate how much slower the guide is compared to the athlete
  // A positive value means the guide is slower (higher pace number = slower)
  const paceDifference = guidePaceNum - athletePaceNum

  // If guide is not slower than athlete, no mismatch
  if (paceDifference <= 0) {
    return 'none'
  }

  // Apply different thresholds based on athlete's pace
  // Threshold is 10 min/mile
  if (athletePaceNum <= 10) {
    // For faster paces (10 min/mile or faster):
    // 'slight' if guide is 0.5 to under 1 minute slower
    // 'significant' if guide is 1 minute or more slower
    if (paceDifference >= 1) {
      return 'significant'
    } else if (paceDifference >= 0.5) {
      return 'slight'
    }
  } else {
    // For slower paces (slower than 10 min/mile):
    // 'slight' if guide is 1 to under 2 minutes slower
    // 'significant' if guide is 2 minutes or more slower
    if (paceDifference >= 2) {
      return 'significant'
    } else if (paceDifference >= 1) {
      return 'slight'
    }
  }

  // No mismatch - guide's pace is close enough to athlete's pace
  return 'none'
}

/**
 * Maps a pace compatibility severity to a background color for visual highlighting.
 *
 * @param severity - The pace compatibility severity level
 * @returns The background color hex code, or null if no highlight should be applied
 */
function getPaceCompatibilityColor(severity: PaceCompatibilitySeverity): string | null {
  switch (severity) {
    case 'significant':
      return '#FFCDBE' // Red highlight
    case 'slight':
      return '#FDFFDC' // Yellow highlight
    default:
      return null
  }
}

/**
 * Maps a pace compatibility severity to a screen reader label.
 *
 * @param severity - The pace compatibility severity level
 * @returns A string describing the pace compatibility for screen readers
 */
function getPaceCompatibilityScreenReaderLabel(severity: PaceCompatibilitySeverity): string {
  switch (severity) {
    case 'significant':
      return ', pace mismatch'
    case 'slight':
      return ', slight pace mismatch'
    default:
      return ''
  }
}

/**
 * Gets the pace compatibility severity for a guide relative to the currently selected athlete.
 * Uses signup pace data instead of profile pace.
 *
 * @param guideId - The ID of the guide
 * @returns The pace compatibility severity level
 */
function getGuideCompatibilitySeverity(guideId: string): PaceCompatibilitySeverity {
  // Only check compatibility if an athlete is selected
  if (!selectedAthleteId.value) {
    return 'none'
  }

  // Get the selected athlete's signup pace
  const athletePace = getSignupPace(selectedAthleteId.value)

  // Get the guide's signup pace
  const guidePace = getSignupPace(guideId)

  return getPaceCompatibilitySeverity(athletePace, guidePace)
}

/**
 * Gets the inline style object for a guide card based on pace compatibility
 * with the currently selected athlete.
 *
 * @param guideId - The ID of the guide
 * @returns An object with backgroundColor property if highlighting is needed, empty object otherwise
 */
function getGuideCardStyle(guideId: string): Record<string, string> {
  const severity = getGuideCompatibilitySeverity(guideId)
  const backgroundColor = getPaceCompatibilityColor(severity)

  if (backgroundColor) {
    return { backgroundColor }
  }

  return {}
}

/**
 * Gets the screen reader label for a guide's pace compatibility
 * with the currently selected athlete.
 *
 * @param guideId - The ID of the guide
 * @returns A string to append to the aria-label describing pace compatibility
 */
function getGuideCompatibilityLabel(guideId: string): string {
  const severity = getGuideCompatibilitySeverity(guideId)
  return getPaceCompatibilityScreenReaderLabel(severity)
}

// ==========================================
// Pace Utility Functions
// ==========================================

/**
 * Get the signup record for a user in the current run.
 * Returns the signup if found, undefined otherwise.
 * @param userId - The user's ID
 * @returns The signup record or undefined
 */
function getSignupForUser(userId: string): SignUp | undefined {
  const signups = signupsStore.getSignUpsForRun(runId.value)
  return signups.find((signup) => signup.userId === userId)
}

/**
 * Get the pace from a user's signup for the current run.
 * Returns the pace object with minutes and seconds if available.
 * @param userId - The user's ID
 * @returns The pace object or undefined if not set
 */
function getSignupPace(userId: string): { minutes: number; seconds: number } | undefined {
  const signup = getSignupForUser(userId)
  return signup?.pace
}

/**
 * Format a pace object as a string in "M:SS" format.
 * For example, { minutes: 9, seconds: 30 } becomes "9:30"
 * @param pace - The pace object with minutes and seconds
 * @returns Formatted pace string, or undefined if pace is not set
 */
function formatPace(pace: { minutes: number; seconds: number } | undefined): string | undefined {
  if (!pace) return undefined
  // Format seconds with leading zero (e.g., 0 -> "00", 15 -> "15")
  const formattedSeconds = pace.seconds.toString().padStart(2, '0')
  return `${pace.minutes}:${formattedSeconds}`
}

/**
 * Get the formatted pace string for a user based on their signup for the current run.
 * @param userId - The user's ID
 * @returns Formatted pace string (e.g., "9:30") or undefined if not set
 */
function getFormattedPaceForUser(userId: string): string | undefined {
  const pace = getSignupPace(userId)
  return formatPace(pace)
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

.pairing-header__top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
   Instructions (inside modal)
   ========================================== */

.instructions-subheading {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 1rem 0 0.5rem 0;
}

.instructions-subheading:first-child {
  margin-top: 0;
}

.instructions-paragraph {
  font-size: 1rem;
  color: var(--color-text, #111827);
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
}

.instructions-list {
  margin: 0 0 0.75rem 0;
  padding: 0 0 0 1.5rem;
  list-style-type: disc;
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
   Actions Bar (How to Pair + Save section)
   ========================================== */

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

/* Help icon button for opening instructions modal */
.help-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 3.75rem;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: color 0.2s ease;
}

.help-icon-button:hover {
  color: white;
}

.help-icon-button:focus {
  outline: 3px solid white;
  outline-offset: 2px;
}

/* Groups the save indicator and save button together on the right */
.actions-save-group {
  display: flex;
  align-items: center;
  gap: 1rem;
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
   Sort Controls
   ========================================== */

.sort-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sort-controls :deep(.button__content) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

.person-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.person-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.3;
}

.role-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border-radius: 0.25rem;
  line-height: 1.5;
}

.role-badge--athlete {
  background-color: var(--color-info-light, #e3f2fd);
  color: var(--color-info-dark, #0d47a1);
  border: 1px solid var(--color-info, #2196f3);
}

.role-badge--guide {
  background-color: var(--color-success-light, #f0f9f4);
  color: var(--color-success-dark, #155724);
  border: 1px solid var(--color-success, #28a745);
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

.paired-guide-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
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

  .actions-save-group {
    justify-content: space-between;
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
