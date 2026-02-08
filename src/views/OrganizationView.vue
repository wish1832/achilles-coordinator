<template>
  <div class="organization-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Loading state for organization data -->
    <LoadingUI
      v-if="organizationLoading === 'loading'"
      type="spinner"
      text="Loading organization..."
      centered
    />

    <!-- Error state -->
    <div v-else-if="organizationLoading === 'error'" class="organization-error">
      <h1>Unable to load organization</h1>
      <p>There was an error loading the organization. Please try again.</p>
      <AchillesButton @click="loadOrganizationData">Try Again</AchillesButton>
    </div>

    <!-- Organization not found -->
    <div v-else-if="organizationLoading === 'success' && !organization" class="organization-error">
      <h1>Organization not found</h1>
      <p>The organization you're looking for doesn't exist or has been removed.</p>
    </div>

    <!-- Organization loaded successfully -->
    <template v-else-if="organization">
      <!-- Header with organization name and description -->
      <header class="organization-header">
        <div class="organization-header__content">
          <h1 class="organization-title">{{ organization.name }}</h1>
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
              <AchillesButton @click="loadRunsData">Try Again</AchillesButton>
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
                        <a href="#" class="signup-status__link" @click.prevent.stop="viewRun(run.id)">
                          View details
                        </a>
                      </div>
                    </template>
                    <AchillesButton
                      v-else
                      variant="primary"
                      size="medium"
                      @click.stop="viewRun(run.id)"
                    >
                      View Run
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import { useOrganizationStore } from '@/stores/organization'
import { useAuthStore } from '@/stores/auth'
import { useRunsStore } from '@/stores/runs'
import { useLocationStore } from '@/stores/location'
import { useSignUpsStore } from '@/stores/signups'
import type { LoadingState } from '@/types'

// Router and route
const route = useRoute()
const router = useRouter()

// Stores
const organizationStore = useOrganizationStore()
const authStore = useAuthStore()
const runsStore = useRunsStore()
const locationStore = useLocationStore()
const signUpsStore = useSignUpsStore()

// Get reactive references from stores
const { currentUser } = storeToRefs(authStore)
const { runs } = storeToRefs(runsStore)

// Local loading states (organization loading is handled by the store, but we track it locally too)
const organizationLoading = ref<LoadingState>('idle')
const runsLoading = ref<LoadingState>('idle')

// Get organization ID from route params
const orgId = computed(() => route.params.orgId as string)

// Get current organization from store
const organization = computed(() => organizationStore.getOrganizationById(orgId.value))

// Check if current user is a member of this organization
const isMember = computed(() => {
  // User must be authenticated to be a member
  if (!currentUser.value) {
    return false
  }
  return organizationStore.isUserOrgMember(orgId.value, currentUser.value.id)
})

// Filter runs for this organization
const organizationRuns = computed(() => {
  return runs.value.filter((run) => run.organizationId === orgId.value)
})

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
 * Load runs data for members
 * Loads upcoming runs, locations, and sign-up counts
 */
async function loadRunsData(): Promise<void> {
  try {
    runsLoading.value = 'loading'

    // Load upcoming runs
    await runsStore.loadUpcomingRuns()

    // Load locations for this organization
    await locationStore.loadLocationsForOrganization(orgId.value)

    // Load sign-ups for runs in this organization
    const runIds = organizationRuns.value.map((run) => run.id)
    if (runIds.length > 0) {
      await signUpsStore.loadSignUpsForRuns(runIds)
    }

    runsLoading.value = 'success'
  } catch {
    runsLoading.value = 'error'
  }
}

/**
 * Get location name by ID
 * Returns the location name if found, otherwise returns 'Unknown Location'
 */
function getLocationName(locationId: string): string {
  const location = locationStore.getLocationById(locationId)
  return location ? location.name : 'Unknown Location'
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
 * Check if the current user has signed up for a specific run
 * Returns true if the user has an active sign-up for the run
 */
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

// Load organization data on mount
onMounted(async () => {
  await loadOrganizationData()

  // If user is a member, also load runs data
  if (isMember.value) {
    await loadRunsData()
  }
})

// Watch for changes in membership status (e.g., user logs in after page load)
// and load runs if they become a member
watch(isMember, async (newValue) => {
  if (newValue && runsLoading.value === 'idle') {
    await loadRunsData()
  }
})
</script>

<style scoped>
/* Main layout */
.organization-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Header */
.organization-header {
  background: linear-gradient(
    135deg,
    var(--color-primary, #0066cc) 0%,
    var(--color-primary-hover, #0052a3) 100%
  );
  color: white;
  padding: 2rem 0;
}

.organization-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.organization-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.organization-description {
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
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
.high-contrast .organization-header {
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
