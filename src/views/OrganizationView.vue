<template>
  <div class="organization-view">

    <!-- Hidden page heading remains available before the organization name has loaded. -->
    <h1 class="sr-only">Organization</h1>

    <!-- Loading state for organization data -->
    <main v-if="organizationLoading === 'loading'" id="main-content" class="organization-main">
      <LoadingUI type="spinner" text="Loading organization..." centered />
    </main>

    <!-- Error state -->
    <main
      v-else-if="organizationLoading === 'error'"
      id="main-content"
      class="organization-main"
      tabindex="-1"
    >
      <div class="organization-error">
        <h1>Unable to load organization</h1>
        <p>There was an error loading the organization. Please try again.</p>
        <AchillesButton @click="retryOrganization">Try Again</AchillesButton>
      </div>
    </main>

    <!-- Organization not found -->
    <main
      v-else-if="organizationLoading === 'success' && !organization"
      id="main-content"
      class="organization-main"
      tabindex="-1"
    >
      <div class="organization-error">
        <h1>Organization not found</h1>
        <p>The organization you're looking for doesn't exist or has been removed.</p>
      </div>
    </main>

    <!-- Organization loaded successfully -->
    <template v-else-if="organization">
      <!-- Header with organization name and description -->
      <header class="organization-header">
        <div class="organization-header__content">
          <div class="organization-header__title-row">
            <h1 class="organization-title">{{ organization.name }}</h1>
            <!-- Edit Org Settings button - only visible to org admins -->
            <AchillesButton
              v-if="isUserOrgAdmin"
              variant="secondary"
              size="small"
              @click="navigateToOrgSettings"
            >
              <font-awesome-icon icon="pencil" aria-hidden="true" />
              Edit Org Settings
            </AchillesButton>
          </div>
          <p v-if="organization.description" class="organization-description">
            {{ organization.description }}
          </p>
        </div>
      </header>

      <!-- Main content -->
      <main id="main-content" class="organization-main">
        <div class="organization-container">
          <!-- Runs section - only visible to members -->
          <section v-if="isMember" class="runs-section" aria-labelledby="runs-heading">
            <h2 id="runs-heading" class="section-heading">Upcoming Runs</h2>

            <!-- Loading runs -->
            <LoadingUI
              v-if="runsLoading === 'loading'"
              type="spinner"
              text="Loading runs..."
              centered
            />

            <!-- Error loading runs -->
            <div v-else-if="runsLoading === 'error'" class="runs-error">
              <p>There was an error loading runs. Please try again.</p>
              <AchillesButton @click="retryRuns">Try Again</AchillesButton>
            </div>

            <!-- Runs list -->
            <div v-else-if="organizationRuns.length > 0" class="runs-list">
              <CardUI
                v-for="run in organizationRuns"
                :key="run.id"
                class="run-card"
                :title="getLocationName(run.locationId)"
                :subtitle="formatRunDate(run.date, run.time)"
                clickable
                @click="viewRun(run.id)"
              >
                <div class="run-content">
                  <p class="run-description">{{ run.description }}</p>

                  <div class="run-details">
                    <div class="run-detail"><strong>Date:</strong> {{ formatDate(run.date) }}</div>
                    <div class="run-detail"><strong>Time:</strong> {{ run.time }}</div>
                    <div class="run-detail run-signup-counts">
                      <span class="signup-count">
                        <strong>Athletes:</strong> {{ getSignUpCountsForRun(run.id).athletes }}
                      </span>
                      <span class="signup-count">
                        <strong>Guides:</strong> {{ getSignUpCountsForRun(run.id).guides }}
                      </span>
                    </div>
                  </div>

                  <div class="run-actions">
                    <!-- Show "signed up!" message if user already signed up, otherwise show "Sign Up" button -->
                    <template v-if="isUserSignedUpForRun(run.id)">
                      <div class="signup-status">
                        <p class="signup-status__message">Signed up!</p>
                        <a href="#" class="signup-status__link" @click.prevent.stop="openEditRSVPModal(run)">
                          edit RSVP
                        </a>
                      </div>
                    </template>
                    <AchillesButton
                      v-else
                      variant="primary"
                      size="medium"
                      @click.stop="openSignUpModal(run)"
                    >
                      Sign Up
                    </AchillesButton>
                  </div>
                </div>
              </CardUI>
            </div>

            <!-- No upcoming runs -->
            <div v-else class="runs-empty">
              <p>There are no upcoming runs scheduled for this organization.</p>
            </div>
          </section>

          <!-- Non-member message -->
          <section v-else class="non-member-section" aria-labelledby="non-member-heading">
            <h2 id="non-member-heading" class="visually-hidden">Membership Required</h2>
            <div class="non-member-message">
              <p>Become a member to see upcoming runs and events.</p>
            </div>
          </section>
        </div>
      </main>

      <!-- Floating Action Button for creating a run - only visible to org admins -->
      <button
        v-if="isUserOrgAdmin"
        type="button"
        class="button-create-run"
        aria-label="Create Run"
        @click="navigateToCreateRun"
      >
        <font-awesome-icon icon="plus" aria-hidden="true" />
      </button>

      <!-- RSVP Modal. The modal owns the create-or-update mutation; we just
           keep the open/close state and provide context (selected run,
           location name, whether we're editing). -->
      <RSVPModal
        :is-open="isRSVPModalOpen"
        :run="selectedRun"
        :location-name="selectedRunLocationName"
        :is-editing="isEditingRSVP"
        :existing-sign-up="existingSignUpData"
        @update:is-open="isRSVPModalOpen = $event"
        @close="closeRSVPModal"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import RSVPModal from '@/components/RSVPModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useNavigationStore } from '@/stores/navigation'
import { useAdminCapabilities } from '@/composables/useAdminCapabilities'
import { useOrganizationQuery } from '@/composables/queries/useOrganizationQuery'
import { useRunsForOrganizationQuery } from '@/composables/queries/useRunsForOrganizationQuery'
import { useLocationsForOrganizationQuery } from '@/composables/queries/useLocationsForOrganizationQuery'
import { useRunsSignUpsQuery } from '@/composables/queries/useRunsSignUpsQuery'
import type { LoadingState, Location, Run } from '@/types'

// Router and route
const route = useRoute()
const router = useRouter()

// Auth is the only Pinia store still in use here — it owns client-side
// session state, which is not server data and stays out of TanStack.
const authStore = useAuthStore()
const { currentUser } = storeToRefs(authStore)

const navigationStore = useNavigationStore()

// Tell the header to show a back button pointing to the Dashboard.
// Runs on every activation so the label is always set when arriving at this view.
onMounted(() => {
  navigationStore.setBackLabel('home')
  navigationStore.setBackDestination('Dashboard', {})
})
onActivated(() => {
  navigationStore.setBackLabel('home')
  navigationStore.setBackDestination('Dashboard', {})
})

// Admin capabilities for checking org admin status (also client-state).
const { isOrgAdmin } = useAdminCapabilities()

// RSVP Modal state
const isRSVPModalOpen = ref(false)
const selectedRun = ref<Run | null>(null)
const isEditingRSVP = ref(false)

// Get organization ID from route params
const orgId = computed(() => route.params.orgId as string)

// === Server state via TanStack Query ===

// Organization detail. The hook handles its own loading/error/refetch — we
// only adapt its status into the LoadingState string the template uses.
const organizationQuery = useOrganizationQuery(orgId)
const organization = computed(() => organizationQuery.data.value ?? undefined)

// Membership is derived from the cached organization document. Declared
// before the queries that gate on it to avoid a temporal-dead-zone error:
// each query's `organizationId` getter reads `isMember` synchronously when
// the hook registers, so the binding must already exist.
const isMember = computed(() => {
  if (!currentUser.value || !organization.value) return false
  return organization.value.memberIds.includes(currentUser.value.id)
})

// Runs for this organization (upcoming only, ascending by date). Gated by
// `isMember` via the hook's reactive enabled flag — non-members never
// trigger the fetch.
const runsQuery = useRunsForOrganizationQuery(
  // Pass undefined when the user is not a member so `enabled` short-circuits
  // and the query doesn't run for non-members.
  computed(() => (isMember.value ? orgId.value : undefined)),
  { timeframe: 'upcoming' },
)
const organizationRuns = computed<Run[]>(() => runsQuery.data.value ?? [])

// Locations for this organization. Used to resolve a run's locationId to a
// human-readable name without fanning out one query per run.
const locationsQuery = useLocationsForOrganizationQuery(
  computed(() => (isMember.value ? orgId.value : undefined)),
)
// Build a Map for O(1) lookups in `getLocationName`. Recomputes only when
// the locations array reference changes.
const locationsById = computed<Map<string, Location>>(() => {
  const map = new Map<string, Location>()
  for (const location of locationsQuery.data.value ?? []) {
    map.set(location.id, location)
  }
  return map
})

// Sign-ups for every run in the org list. Returns a reactive map keyed by
// runId; entries default to [] until the per-run query resolves.
const runIds = computed(() => organizationRuns.value.map((run) => run.id))
const { signUpsByRun } = useRunsSignUpsQuery(runIds)

// === Derived state ===

// Admin status is derived from the resolved organization's adminIds.
const isUserOrgAdmin = computed(() => {
  if (!organization.value) return false
  return isOrgAdmin(organization.value.adminIds)
})

// Map TanStack's pending/error/success status to the LoadingState string the
// template already expects. Keeps the template untouched while still
// reflecting the query lifecycle accurately.
const organizationLoading = computed<LoadingState>(() => {
  if (organizationQuery.isPending.value) return 'loading'
  if (organizationQuery.isError.value) return 'error'
  return 'success'
})

// Runs loading state aggregates the runs list, locations, and per-run
// sign-ups — the section can't render correctly until all three resolve.
const runsLoading = computed<LoadingState>(() => {
  // If the user is not a member, we never load this section.
  if (!isMember.value) return 'idle'
  if (runsQuery.isError.value || locationsQuery.isError.value) return 'error'
  if (runsQuery.isPending.value || locationsQuery.isPending.value) return 'loading'
  return 'success'
})

// Retry handlers used by the template's "Try Again" buttons. TanStack
// re-runs the queryFn and updates status without any manual state juggling.
function retryOrganization(): void {
  organizationQuery.refetch()
}

function retryRuns(): void {
  runsQuery.refetch()
  locationsQuery.refetch()
}

// Computed: Get the location name for the selected run
const selectedRunLocationName = computed(() => {
  if (!selectedRun.value) return 'Unknown Location'
  return getLocationName(selectedRun.value.locationId)
})

// Computed: Get existing sign-up data for editing. Reads from the cached
// runs-sign-ups map so it updates automatically after the user RSVPs.
const existingSignUpData = computed(() => {
  if (!selectedRun.value || !currentUser.value || !isEditingRSVP.value) {
    return undefined
  }

  const signUps = signUpsByRun.value[selectedRun.value.id] ?? []
  const userSignUp = signUps.find(
    (signup) =>
      signup.userId === currentUser.value!.id &&
      (signup.status === 'yes' || signup.status === 'maybe'),
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

/**
 * Get location name by ID via the cached locations map.
 * Returns 'Unknown Location' if the location hasn't loaded or doesn't exist.
 */
function getLocationName(locationId: string): string {
  return locationsById.value.get(locationId)?.name ?? 'Unknown Location'
}

/**
 * Compute athlete + guide sign-up counts for a run from the cached map.
 * Mirrors the count semantics the previous store helper exposed.
 */
function getSignUpCountsForRun(runId: string): { athletes: number; guides: number } {
  const signUps = signUpsByRun.value[runId] ?? []
  let athletes = 0
  let guides = 0
  for (const signUp of signUps) {
    // Only RSVPs of 'yes' or 'maybe' count toward the headcount; 'no'
    // sign-ups exist as a record of the response but shouldn't inflate the
    // displayed numbers.
    if (signUp.status !== 'yes' && signUp.status !== 'maybe') continue
    if (signUp.role === 'athlete') athletes += 1
    else if (signUp.role === 'guide') guides += 1
  }
  return { athletes, guides }
}

/**
 * Format run date and time for display
 */
function formatRunDate(date: Date, time: string): string {
  const runDate = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return `${runDate.toLocaleDateString('en-US', options)} at ${time}`
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const runDate = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return runDate.toLocaleDateString('en-US', options)
}

/**
 * Navigate to run details page
 */
function viewRun(runId: string): void {
  router.push(`/organizations/${orgId.value}/runs/${runId}`)
}

/**
 * Navigate to the create run page
 * Only available to organization admins
 */
function navigateToCreateRun(): void {
  router.push(`/organizations/${orgId.value}/runs/create`)
}

/**
 * Navigate to the organization settings page
 * Only available to organization admins
 */
function navigateToOrgSettings(): void {
  router.push(`/organizations/${orgId.value}/settings`)
}

/**
 * Check if the current user has signed up for a specific run
 * Returns true if the user has an active sign-up for the run (status is 'yes' or 'maybe')
 */
function isUserSignedUpForRun(runId: string): boolean {
  // If no user is logged in, they cannot be signed up
  if (!currentUser.value) {
    return false
  }

  // Read sign-ups from the cached map populated by useRunsSignUpsQuery.
  // Defaults to [] when the per-run query hasn't resolved yet.
  const signUps = signUpsByRun.value[runId] ?? []

  // Check if any sign-up with status 'yes' or 'maybe' belongs to the current user
  return signUps.some(
    (signup) =>
      signup.userId === currentUser.value!.id &&
      (signup.status === 'yes' || signup.status === 'maybe'),
  )
}

/**
 * Open the RSVP modal for signing up to a run
 */
function openSignUpModal(run: Run): void {
  selectedRun.value = run
  isEditingRSVP.value = false
  isRSVPModalOpen.value = true
}

/**
 * Open the RSVP modal for editing an existing sign-up
 */
function openEditRSVPModal(run: Run): void {
  selectedRun.value = run
  isEditingRSVP.value = true
  isRSVPModalOpen.value = true
}

/**
 * Close the RSVP modal
 */
function closeRSVPModal(): void {
  isRSVPModalOpen.value = false
  selectedRun.value = null
  isEditingRSVP.value = false
}

</script>

<style scoped>
/* Main layout */
.organization-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Header */
.organization-header {
  padding: 2rem 0;
}

.organization-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.organization-header__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.organization-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
  color: var(--color-text, #111827);
}

.organization-description {
  font-size: 1.25rem;
  margin: 0;
  line-height: 1.4;
  color: var(--color-text-muted, #6b7280);
}

/* Main content */
.organization-main {
  padding: 2rem 0;
}

.organization-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Section heading */
.section-heading {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--color-text, #111827);
}

/* Runs section */
.runs-section {
  margin-bottom: 2rem;
}

/* Floating Action Button for creating a run */
.button-create-run {
  /* Fixed position in bottom right corner */
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 100;

  /* Circular shape */
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;

  /* Styling */
  background-color: var(--color-primary, #0066cc);
  color: white;
  border: none;
  cursor: pointer;

  /* Center the icon */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Icon size */
  font-size: 1.5rem;

  /* Shadow for elevation */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);

  /* Smooth transitions */
  transition:
    background-color 0.2s ease-in-out,
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.button-create-run:hover {
  background-color: var(--color-primary-hover, #0052a3);
  transform: scale(1.05);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.button-create-run:focus {
  outline: none;
  box-shadow:
    0 0 0 3px var(--color-bg-secondary, #f9fafb),
    0 0 0 5px var(--color-primary, #0066cc);
}

.button-create-run:active {
  transform: scale(0.95);
}

/* Runs list */
.runs-list {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.run-card {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.run-card:hover {
  transform: translateY(-2px);
  box-shadow: var(
    --shadow-lg,
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05)
  );
}

.run-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.run-description {
  color: var(--color-text-muted, #6b7280);
  line-height: 1.6;
  margin: 0;
}

.run-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.run-detail {
  font-size: 0.875rem;
  color: var(--color-text, #111827);
  line-height: 1.4;
}

.run-signup-counts {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
}

.signup-count {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.run-actions {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

/* Signup status display */
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
.organization-error,
.runs-error {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.organization-error {
  max-width: 600px;
  margin: 2rem auto;
}

.organization-error h1,
.runs-error h2 {
  color: var(--color-error, #dc2626);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.organization-error p,
.runs-error p {
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
}

/* Empty state */
.runs-empty {
  text-align: center;
  padding: 2rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.runs-empty p {
  color: var(--color-text-muted, #6b7280);
  margin: 0;
}

/* Non-member section */
.non-member-section {
  margin-bottom: 2rem;
}

.non-member-message {
  text-align: center;
  padding: 2rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.non-member-message p {
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  font-size: 1.125rem;
}

/* Visually hidden (for screen readers) */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Text size support */
.text-size-small .organization-title {
  font-size: 2rem;
}

.text-size-small .organization-description {
  font-size: 1.125rem;
}

.text-size-large .organization-title {
  font-size: 3rem;
}

.text-size-large .organization-description {
  font-size: 1.375rem;
}

.text-size-extra-large .organization-title {
  font-size: 3.5rem;
}

.text-size-extra-large .organization-description {
  font-size: 1.5rem;
}

/* High contrast mode */
.high-contrast .run-card {
  border: 2px solid var(--color-text, #000000);
}

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

.high-contrast .button-create-run {
  border: 2px solid var(--color-text, #000000);
}

/* Reduced motion support */
.reduced-motion .run-card {
  transition: none;
}

.reduced-motion .run-card:hover {
  transform: none;
}

.reduced-motion .signup-status__link {
  transition: none;
}

.reduced-motion .button-create-run {
  transition: none;
}

.reduced-motion .button-create-run:hover {
  transform: none;
}

.reduced-motion .button-create-run:active {
  transform: none;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .runs-list {
    grid-template-columns: 1fr;
  }

  .organization-title {
    font-size: 2rem;
  }

  .organization-description {
    font-size: 1.125rem;
  }
}

@media (max-width: 640px) {
  .organization-header {
    padding: 1.5rem 0;
  }

  .organization-main {
    padding: 1.5rem 0;
  }

  .organization-container {
    padding: 0 0.5rem;
  }
}
</style>
