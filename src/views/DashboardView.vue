<template>
  <div class="dashboard-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Main content -->
    <main id="main-content" class="dashboard-main">
      <div class="dashboard-container">
        <!-- Organizations Section -->
        <section class="dashboard-section" aria-labelledby="organizations-heading">
          <h2 id="organizations-heading" class="section-title">Organizations</h2>

          <!-- Loading state for organizations -->
          <LoadingUI
            v-if="organizationsLoading === 'loading'"
            type="spinner"
            text="Loading organizations..."
            centered
          />

          <!-- Organizations list -->
          <div v-else-if="userOrganizations.length > 0" class="organizations-list">
            <router-link
              v-for="org in userOrganizations"
              :key="org.id"
              :to="`/organizations/${org.id}`"
              class="organization-link"
              :aria-label="`Go to ${org.name} organization page`"
            >
              <span class="organization-avatar" aria-hidden="true">
                {{ getOrgInitials(org.name) }}
              </span>
              <span class="organization-name">{{ org.name }}</span>
            </router-link>
          </div>

          <!-- Empty state for organizations -->
          <div v-else class="organizations-empty">
            <p>You are not a member of any organizations yet.</p>
          </div>
        </section>

        <!-- Upcoming Runs Section -->
        <section class="dashboard-section" aria-labelledby="runs-heading">
          <h2 id="runs-heading" class="section-title">Upcoming Runs</h2>

          <!-- Loading state for runs -->
          <LoadingUI
            v-if="runsLoading === 'loading'"
            type="spinner"
            text="Loading runs..."
            centered
          />

          <!-- Error state for runs -->
          <div v-else-if="runsLoading === 'error'" class="runs-error">
            <h3>Unable to load runs</h3>
            <p>There was an error loading the runs. Please try again.</p>
            <AchillesButton @click="runsStore.loadUpcomingRuns">Try Again</AchillesButton>
          </div>

          <!-- Runs list -->
          <div v-else-if="runs.length > 0" class="runs-list">
            <CardUI
              v-for="run in runs"
              :key="run.id"
              class="run-card"
              :title="getLocationName(run.locationId)"
              :subtitle="formatRunDate(run.date, run.time)"
              clickable
              @click="viewRun(run.organizationId, run.id)"
            >
              <div class="run-content">
                <p class="run-description">{{ run.description }}</p>

                <div class="run-details">
                  <div class="run-detail"><strong>Date:</strong> {{ formatDate(run.date) }}</div>
                  <div class="run-detail"><strong>Time:</strong> {{ run.time }}</div>
                  <div class="run-detail run-signup-counts">
                    <span class="signup-count">
                      <strong>Athletes:</strong> {{ signUpsStore.getSignUpCounts(run.id).athletes }}
                    </span>
                    <span class="signup-count">
                      <strong>Guides:</strong> {{ signUpsStore.getSignUpCounts(run.id).guides }}
                    </span>
                  </div>
                </div>

                <div class="run-actions">
                  <!-- Show "signed up!" message if user already signed up, otherwise show "Sign Up" button -->
                  <template v-if="isUserSignedUpForRun(run.id)">
                    <div class="signup-status">
                      <p class="signup-status__message">Signed up!</p>
                      <a
                        href="#"
                        class="signup-status__link"
                        @click.prevent.stop="openEditRSVPModal(run)"
                      >
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

          <!-- Empty state for runs -->
          <div v-else class="runs-empty">
            <h3>No upcoming runs</h3>
            <p>There are no upcoming runs scheduled at this time.</p>
          </div>
        </section>
      </div>
    </main>

    <!-- RSVP Modal -->
    <RSVPModal
      :is-open="isRSVPModalOpen"
      :run="selectedRun"
      :location-name="selectedRunLocationName"
      :is-editing="isEditingRSVP"
      :existing-sign-up="existingSignUpData"
      @update:is-open="isRSVPModalOpen = $event"
      @close="closeRSVPModal"
      @submitted="handleRSVPSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import RSVPModal from '@/components/RSVPModal.vue'
import { useRunsStore } from '@/stores/runs'
import { useLocationStore } from '@/stores/location'
import { useSignUpsStore } from '@/stores/signups'
import { useAuthStore } from '@/stores/auth'
import { useOrganizationStore } from '@/stores/organization'
import type { Run } from '@/types'

// Router and stores
const router = useRouter()
const runsStore = useRunsStore()
const locationStore = useLocationStore()
const signUpsStore = useSignUpsStore()
const authStore = useAuthStore()
const organizationStore = useOrganizationStore()

// Destructure refs from stores
const { runs, loading: runsLoading } = storeToRefs(runsStore)
const { currentUser } = storeToRefs(authStore)
const { loading: organizationsLoading } = storeToRefs(organizationStore)

// RSVP Modal state
const isRSVPModalOpen = ref(false)
const selectedRun = ref<Run | null>(null)
const isEditingRSVP = ref(false)

// Computed: Get the user's organizations (where they are a member)
const userOrganizations = computed(() => {
  if (!currentUser.value) return []
  return organizationStore.getUserMemberOrganizations(currentUser.value.id)
})

// Computed: Get the location name for the selected run
const selectedRunLocationName = computed(() => {
  if (!selectedRun.value) return 'Unknown Location'
  return getLocationName(selectedRun.value.locationId)
})

// Computed: Get existing sign-up data for editing
const existingSignUpData = computed(() => {
  if (!selectedRun.value || !currentUser.value || !isEditingRSVP.value) {
    return undefined
  }

  // Find the user's sign-up for this run
  const signUps = signUpsStore.getSignUpsForRun(selectedRun.value.id)
  const userSignUp = signUps.find(
    (signup) => signup.userId === currentUser.value!.id && signup.status !== 'no',
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
 * Generate initials from an organization name
 * Takes the first letter of up to the first two words
 * @param name - The organization name
 * @returns Initials string (1-2 uppercase letters)
 */
function getOrgInitials(name: string): string {
  const trimmedName = name.trim()
  if (!trimmedName) return '?'

  // Split by whitespace to get individual words, filtering out empty strings
  const words = trimmedName.split(/\s+/).filter((word) => word.length > 0)

  // Get the first letter of the first word
  const firstInitial = words[0]?.charAt(0).toUpperCase() ?? '?'

  if (words.length === 1) {
    // Single word: return just the first letter
    return firstInitial
  } else {
    // Multiple words: return first letter of first two words
    const secondInitial = words[1]?.charAt(0).toUpperCase() ?? ''
    return firstInitial + secondInitial
  }
}

// Helper function to get location name by ID
// Returns the location name if found, otherwise returns 'Unknown Location'
function getLocationName(locationId: string): string {
  const location = locationStore.getLocationById(locationId)
  return location ? location.name : 'Unknown Location'
}

// Format run date and time for display
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

// Format date for display
function formatDate(date: Date): string {
  const runDate = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return runDate.toLocaleDateString('en-US', options)
}

// Navigation
function viewRun(orgId: string, runId: string): void {
  router.push(`/organizations/${orgId}/runs/${runId}`)
}

// Check if the current user has signed up for a specific run
// Returns true if the user has an active sign-up for the run (status is 'yes' or 'maybe')
function isUserSignedUpForRun(runId: string): boolean {
  // If no user is logged in, they cannot be signed up
  if (!currentUser.value) {
    return false
  }

  // Get all sign-ups for this run
  const signUps = signUpsStore.getSignUpsForRun(runId)

  // Check if any sign-up with status 'yes' or 'maybe' belongs to the current user
  return signUps.some(
    (signup) =>
      signup.userId === currentUser.value!.id &&
      (signup.status === 'yes' || signup.status === 'maybe'),
  )
}

// Open the RSVP modal for signing up to a run
function openSignUpModal(run: Run): void {
  selectedRun.value = run
  isEditingRSVP.value = false
  isRSVPModalOpen.value = true
}

// Open the RSVP modal for editing an existing sign-up
function openEditRSVPModal(run: Run): void {
  selectedRun.value = run
  isEditingRSVP.value = true
  isRSVPModalOpen.value = true
}

// Close the RSVP modal
function closeRSVPModal(): void {
  isRSVPModalOpen.value = false
  selectedRun.value = null
  isEditingRSVP.value = false
}

// Handle successful RSVP submission
// The modal handles the actual sign-up creation/update, we just need to close it
function handleRSVPSubmitted(): void {
  closeRSVPModal()
}

// Initialize on mount
// Load organizations, runs, locations, and sign-ups when the component mounts
onMounted(async () => {
  // Load user's organizations if we have a current user
  if (currentUser.value) {
    await organizationStore.loadUserOrganizations(currentUser.value.id)
  }

  // Load the upcoming runs
  await runsStore.loadUpcomingRuns()

  // Then, load locations for all organizations that have runs
  // Extract unique organization IDs from the loaded runs
  const organizationIds = new Set(runs.value.map((run) => run.organizationId))

  // Load locations for each unique organization
  // This ensures we have location data to display location names
  for (const orgId of organizationIds) {
    await locationStore.loadLocationsForOrganization(orgId)
  }

  // Load sign-ups for all runs
  // This allows us to display athlete and guide counts for each run
  const runIds = runs.value.map((run) => run.id)
  if (runIds.length > 0) {
    await signUpsStore.loadSignUpsForRuns(runIds)
  }
})
</script>

<style scoped>
/* Main layout */
.dashboard-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Main content */
.dashboard-main {
  padding: 2rem 0;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Section styling */
.dashboard-section {
  margin-bottom: 2.5rem;
}

.dashboard-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #111827);
  margin: 0 0 1.25rem 0;
  line-height: 1.2;
}

/* Organizations list */
.organizations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.organization-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
  text-decoration: none;
  color: var(--color-text, #111827);
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.organization-link:hover {
  transform: translateY(-2px);
  box-shadow: var(
    --shadow-lg,
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05)
  );
}

.organization-link:focus {
  outline: 2px solid var(--color-primary, #0066cc);
  outline-offset: 2px;
}

.organization-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: var(--color-primary, #0066cc);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  flex-shrink: 0;
}

.organization-name {
  font-weight: 500;
  font-size: 1rem;
}

/* Empty state for organizations */
.organizations-empty {
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.organizations-empty p {
  color: var(--color-text-muted, #6b7280);
  margin: 0;
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
.runs-error {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.runs-error h3 {
  color: var(--color-error, #dc2626);
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.runs-error p {
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
}

/* Empty state for runs */
.runs-empty {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.runs-empty h3 {
  color: var(--color-text, #111827);
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.runs-empty p {
  color: var(--color-text-muted, #6b7280);
  margin: 0;
}

/* Text size support */
.text-size-small .section-title {
  font-size: 1.25rem;
}

.text-size-large .section-title {
  font-size: 1.75rem;
}

.text-size-extra-large .section-title {
  font-size: 2rem;
}

/* High contrast mode */
.high-contrast .organization-link {
  border: 2px solid var(--color-text, #000000);
}

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

/* Reduced motion support */
.reduced-motion .organization-link {
  transition: none;
}

.reduced-motion .organization-link:hover {
  transform: none;
}

.reduced-motion .run-card {
  transition: none;
}

.reduced-motion .run-card:hover {
  transform: none;
}

.reduced-motion .signup-status__link {
  transition: none;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .runs-list {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.375rem;
  }
}

@media (max-width: 640px) {
  .dashboard-main {
    padding: 1.5rem 0;
  }

  .dashboard-container {
    padding: 0 0.5rem;
  }

  .organizations-list {
    flex-direction: column;
  }

  .organization-link {
    width: 100%;
  }
}
</style>
