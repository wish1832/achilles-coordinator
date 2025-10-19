<template>
  <div class="runs-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Header -->
    <header class="runs-header">
      <div class="runs-header__content">
        <h1 class="runs-title">Upcoming Runs</h1>
        <p class="runs-subtitle">Sign up for upcoming Achilles International runs</p>
      </div>
    </header>

    <!-- Main content -->
    <main id="main-content" class="runs-main">
      <div class="runs-container">
        <!-- Loading state -->
        <Loading v-if="loading === 'loading'" type="spinner" text="Loading runs..." centered />

        <!-- Error state -->
        <div v-else-if="loading === 'error'" class="runs-error">
          <h2>Unable to load runs</h2>
          <p>There was an error loading the runs. Please try again.</p>
          <Button @click="loadRuns"> Try Again </Button>
        </div>

        <!-- Runs list -->
        <div v-else-if="runs.length > 0" class="runs-list">
          <Card
            v-for="run in runs"
            :key="run.id"
            class="run-card"
            :title="run.location"
            :subtitle="formatRunDate(run.date, run.time)"
            clickable
            @click="viewRun(run.id)"
          >
            <div class="run-content">
              <p class="run-description">{{ run.description }}</p>

              <div class="run-details">
                <div class="run-detail"><strong>Date:</strong> {{ formatDate(run.date) }}</div>
                <div class="run-detail"><strong>Time:</strong> {{ run.time }}</div>
                <div class="run-detail"><strong>Location:</strong> {{ run.location }}</div>
              </div>

              <div class="run-actions">
                <Button variant="primary" size="medium" @click.stop="signUpForRun(run.id)">
                  Sign Up
                </Button>
              </div>
            </div>
          </Card>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccessibilityStore } from '@/stores/accessibility'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Loading from '@/components/ui/Loading.vue'
import type { Run, LoadingState } from '@/types'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()
const accessibilityStore = useAccessibilityStore()

// State
const runs = ref<Run[]>([])
const loading = ref<LoadingState>('idle')

// Load runs data
async function loadRuns(): Promise<void> {
  try {
    loading.value = 'loading'

    // TODO: Replace with actual API call to Firestore
    // For now, using mock data
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

    runs.value = [
      {
        id: '1',
        date: new Date('2024-02-15'),
        time: '08:00',
        location: 'Central Park',
        description: 'Morning run through Central Park with beautiful scenery',
        createdBy: 'admin1',
        createdAt: new Date('2024-01-01'),
        status: 'upcoming',
      },
      {
        id: '2',
        date: new Date('2024-02-22'),
        time: '09:00',
        location: 'Brooklyn Bridge',
        description: 'Scenic run across the Brooklyn Bridge and back',
        createdBy: 'admin1',
        createdAt: new Date('2024-01-01'),
        status: 'upcoming',
      },
    ]

    loading.value = 'success'
  } catch (error) {
    console.error('Error loading runs:', error)
    loading.value = 'error'
  }
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

// Initialize on mount
onMounted(() => {
  loadRuns()
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

.run-actions {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
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

/* Reduced motion support */
.reduced-motion .run-card {
  transition: none;
}

.reduced-motion .run-card:hover {
  transform: none;
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
