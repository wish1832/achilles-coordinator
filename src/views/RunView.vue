<template>
  <div class="run-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Header -->
    <header class="run-header">
      <div class="run-header__content">
        <h1 class="run-title">{{ locationName }}</h1>
        <p v-if="organizationName" class="run-subtitle">{{ organizationName }}</p>
      </div>
    </header>

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
              <ul v-if="adminNames.length > 0" class="admin-list">
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
                  <a href="#" class="signup-status__link" @click.prevent="editRSVP"> edit RSVP </a>
                </div>
              </template>
              <AchillesButton v-else variant="primary" size="medium" @click="signUpForRun">
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
          <AchillesButton @click="router.push('/runs')">Back to Runs</AchillesButton>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import { useRunsStore } from '@/stores/runs'
import { useLocationStore } from '@/stores/location'
import { useOrganizationStore } from '@/stores/organization'
import { useSignUpsStore } from '@/stores/signups'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useAdminCapabilities } from '@/composables/useAdminCapabilities'
import type { Location, LoadingState } from '@/types'

// Router and stores
const router = useRouter()
const route = useRoute()
const runsStore = useRunsStore()
const locationStore = useLocationStore()
const organizationStore = useOrganizationStore()
const signUpsStore = useSignUpsStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const { canManageRun } = useAdminCapabilities()

// Local state for tracking loading and errors
const loading = ref<LoadingState>('idle')
const error = ref<string | null>(null)

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

// Get the display names of the admins
const adminNames = computed(() => {
  return adminIds.value
    .map((id) => usersStore.getUserById(id))
    .filter((user) => user !== undefined)
    .map((user) => user!.displayName)
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

  // Check if any active sign-up belongs to the current user
  return signUps.some(
    (signup) => signup.userId === authStore.currentUser!.id && signup.status === 'active',
  )
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

    // Determine which admin IDs to load
    // Use run-specific admins if available, otherwise use org admins
    let adminIdsToLoad: string[] = []
    if (runsStore.currentRun.runAdminIds && runsStore.currentRun.runAdminIds.length > 0) {
      adminIdsToLoad = runsStore.currentRun.runAdminIds
    } else if (organization.value) {
      adminIdsToLoad = organization.value.adminIds
    }

    // Load admin user data for all admin IDs
    await usersStore.loadUsers(adminIdsToLoad)

    // Load sign-ups for this run
    await signUpsStore.loadSignUpsForRun(runId.value)

    loading.value = 'success'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load run details'
    loading.value = 'error'
    console.error('Error loading run data:', err)
  }
}

// Sign up for the run
async function signUpForRun(): Promise<void> {
  try {
    // TODO: Implement sign up logic
    console.log('Signing up for run:', runId.value)
    // This would call the signup store/service
  } catch (err) {
    console.error('Error signing up for run:', err)
  }
}

// Navigate to edit RSVP (for now, just a placeholder)
function editRSVP(): void {
  // TODO: Implement RSVP editing
  console.log('Editing RSVP for run:', runId.value)
}

// Navigate to the pairings management page for this run
function navigateToPairings(): void {
  router.push(`/runs/${runId.value}/pairing`)
}

// Initialize on mount
// Load all run data when the component mounts
onMounted(() => {
  loadRunData()
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
  background: linear-gradient(
    135deg,
    var(--color-primary, #0066cc) 0%,
    var(--color-primary-hover, #0052a3) 100%
  );
  color: white;
  padding: 2rem 0;
}

.run-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.run-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.run-subtitle {
  font-size: 1.25rem;
  font-weight: 400;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
  opacity: 0.95;
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
.high-contrast .run-header {
  background: var(--color-primary, #000000);
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
</style>
