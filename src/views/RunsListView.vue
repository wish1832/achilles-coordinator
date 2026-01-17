<template>
  <div class="runs-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Header -->
    <header class="runs-header">
      <div class="runs-header__content">
        <h1 class="runs-title">Upcoming Runs</h1>
      </div>
    </header>

    <!-- Main content -->
    <main id="main-content" class="runs-main">
      <div class="runs-container">
        <!-- Loading state -->
        <LoadingUI v-if="loading === 'loading'" type="spinner" text="Loading runs..." centered />

        <div v-else-if="loading === 'error'" class="runs-error">
          <h2>Unable to load runs</h2>
          <p>There was an error loading the runs. Please try again.</p>
          <AchillesButton @click="runsStore.loadUpcomingRuns"> Try Again </AchillesButton>
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
            @click="viewRun(run.id)"
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
                    <a href="#" class="signup-status__link" @click.prevent.stop="editRSVP(run.id)">
                      edit RSVP
                    </a>
                  </div>
                </template>
                <AchillesButton
                  v-else
                  variant="primary"
                  size="medium"
                  @click.stop="signUpForRun(run.id)"
                >
                  Sign Up
                </AchillesButton>
              </div>
            </div>
          </CardUI>
        </div>

        <!-- Empty state -->
        <div v-else class="runs-empty">
          <h2>No upcoming runs</h2>
          <p>There are no upcoming runs scheduled at this time.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import { useRunsStore } from '@/stores/runs'
import { useLocationStore } from '@/stores/location'
import { useSignUpsStore } from '@/stores/signups'
import { useAuthStore } from '@/stores/auth'

// Router and stores
const router = useRouter()
const runsStore = useRunsStore()
const locationStore = useLocationStore()
const signUpsStore = useSignUpsStore()
const authStore = useAuthStore()

const { runs, loading } = storeToRefs(runsStore)
const { currentUser } = storeToRefs(authStore)

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
function viewRun(runId: string): void {
  router.push(`/runs/${runId}`)
}

// Sign up for a run
async function signUpForRun(runId: string): Promise<void> {
  try {
    // TODO: Implement sign up logic
    console.log('Signing up for run:', runId)
    // This would call the signup store/service
  } catch (error) {
    console.error('Error signing up for run:', error)
  }
}

// Check if the current user has signed up for a specific run
// Returns true if the user has an active sign-up for the run
function isUserSignedUpForRun(runId: string): boolean {
  // If no user is logged in, they cannot be signed up
  if (!currentUser.value) {
    return false
  }

  // Get all sign-ups for this run
  const signUps = signUpsStore.getSignUpsForRun(runId)

  // Check if any active sign-up belongs to the current user
  return signUps.some(
    (signup) => signup.userId === currentUser.value!.id && signup.status === 'active',
  )
}

// Navigate to edit RSVP for a run
function editRSVP(runId: string): void {
  // Navigate to the run details page where user can edit their RSVP
  router.push(`/runs/${runId}`)
}

// Initialize on mount
// Load runs, locations, and sign-ups when the component mounts
onMounted(async () => {
  // First, load the upcoming runs
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
.runs-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Header */
.runs-header {
  background: linear-gradient(
    135deg,
    var(--color-primary, #0066cc) 0%,
    var(--color-primary-hover, #0052a3) 100%
  );
  color: white;
  padding: 2rem 0;
}

.runs-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.runs-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.runs-subtitle {
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
}

/* Main content */
.runs-main {
  padding: 2rem 0;
}

.runs-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
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

.runs-error h2 {
  color: var(--color-error, #dc2626);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.runs-error p {
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
}

/* Empty state */
.runs-empty {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.runs-empty h2 {
  color: var(--color-text, #111827);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.runs-empty p {
  color: var(--color-text-muted, #6b7280);
  margin: 0;
}

/* Text size support */
.text-size-small .runs-title {
  font-size: 2rem;
}

.text-size-small .runs-subtitle {
  font-size: 1.125rem;
}

.text-size-large .runs-title {
  font-size: 3rem;
}

.text-size-large .runs-subtitle {
  font-size: 1.375rem;
}

.text-size-extra-large .runs-title {
  font-size: 3.5rem;
}

.text-size-extra-large .runs-subtitle {
  font-size: 1.5rem;
}

/* High contrast mode */
.high-contrast .runs-header {
  background: var(--color-primary, #000000);
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

  .runs-title {
    font-size: 2rem;
  }

  .runs-subtitle {
    font-size: 1.125rem;
  }
}

@media (max-width: 640px) {
  .runs-header {
    padding: 1.5rem 0;
  }

  .runs-main {
    padding: 1.5rem 0;
  }

  .runs-container {
    padding: 0 0.5rem;
  }
}
</style>
