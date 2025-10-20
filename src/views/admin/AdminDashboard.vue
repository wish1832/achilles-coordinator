<template>
  <div class="admin-dashboard">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Header -->
    <header class="admin-header">
      <div class="admin-header__content">
        <h1 class="admin-title">Admin Dashboard</h1>
        <p class="admin-subtitle">Manage runs, users, and pairings for Achilles International</p>
      </div>
    </header>

    <!-- Main content -->
    <main id="main-content" class="admin-main">
      <div class="admin-container">
        <!-- Quick stats -->
        <section class="admin-stats" aria-labelledby="stats-heading">
          <h2 id="stats-heading" class="sr-only">Quick Statistics</h2>
          <div class="stats-grid">
            <CardUI class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.upcomingRuns }}</div>
                <div class="stat-label">Upcoming Runs</div>
              </div>
            </CardUI>
            <CardUI class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.totalUsers }}</div>
                <div class="stat-label">Total Users</div>
              </div>
            </CardUI>
            <CardUI class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.activeSignUps }}</div>
                <div class="stat-label">Active Sign-ups</div>
              </div>
            </CardUI>
            <CardUI class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.completedPairings }}</div>
                <div class="stat-label">Completed Pairings</div>
              </div>
            </CardUI>
          </div>
        </section>

        <!-- Quick actions -->
        <section class="admin-actions" aria-labelledby="actions-heading">
          <h2 id="actions-heading">Quick Actions</h2>
          <div class="actions-grid">
            <CardUI class="action-card" clickable @click="navigateTo('/admin/runs')">
              <div class="action-content">
                <div class="action-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div class="action-text">
                  <h3>Manage Runs</h3>
                  <p>Create, edit, and manage running events</p>
                </div>
              </div>
            </CardUI>

            <CardUI class="action-card" clickable @click="navigateTo('/admin/users')">
              <div class="action-content">
                <div class="action-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div class="action-text">
                  <h3>Manage Users</h3>
                  <p>Add, edit, and manage user accounts</p>
                </div>
              </div>
            </CardUI>

            <CardUI class="action-card" clickable @click="navigateTo('/admin/pairings')">
              <div class="action-content">
                <div class="action-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <path d="M20 8v6" />
                    <path d="M23 11h-6" />
                  </svg>
                </div>
                <div class="action-text">
                  <h3>Manage Pairings</h3>
                  <p>Pair athletes with guides for runs</p>
                </div>
              </div>
            </CardUI>
          </div>
        </section>

        <!-- Recent activity -->
        <section class="admin-activity" aria-labelledby="activity-heading">
          <h2 id="activity-heading">Recent Activity</h2>
          <CardUI class="activity-card">
            <div class="activity-list">
              <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                <div
                  class="activity-icon"
                  :class="`activity-icon--${activity.type}`"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                    <path d="M13 12h3" />
                    <path d="M8 12h3" />
                  </svg>
                </div>
                <div class="activity-content">
                  <div class="activity-text">{{ activity.text }}</div>
                  <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
                </div>
              </div>
            </div>
          </CardUI>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CardUI from '@/components/ui/CardUI.vue'

// Router and stores
const router = useRouter()
// auth store not used directly in this view

// State
const stats = ref({
  upcomingRuns: 0,
  totalUsers: 0,
  activeSignUps: 0,
  completedPairings: 0,
})

const recentActivity = ref([
  {
    id: '1',
    type: 'run',
    text: 'New run created: Central Park Morning Run',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: '2',
    type: 'user',
    text: 'New user registered: John Smith (Athlete)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    type: 'pairing',
    text: 'Pairing created: Sarah Johnson & Mike Davis',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
])

// Load dashboard data
async function loadDashboardData(): Promise<void> {
  try {
    // TODO: Replace with actual API calls
    // For now, using mock data
    await new Promise((resolve) => setTimeout(resolve, 500))

    stats.value = {
      upcomingRuns: 5,
      totalUsers: 24,
      activeSignUps: 18,
      completedPairings: 12,
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

// Navigation
function navigateTo(path: string): void {
  router.push(path)
}

// Format time for display
function formatTime(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes} minutes ago`
  } else if (hours < 24) {
    return `${hours} hours ago`
  } else {
    return `${days} days ago`
  }
}

// Initialize on mount
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* Main layout */
.admin-dashboard {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Header */
.admin-header {
  background: linear-gradient(
    135deg,
    var(--color-primary, #0066cc) 0%,
    var(--color-primary-hover, #0052a3) 100%
  );
  color: white;
  padding: 2rem 0;
}

.admin-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.admin-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.admin-subtitle {
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
}

/* Main content */
.admin-main {
  padding: 2rem 0;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Stats section */
.admin-stats {
  /* Styles handled by stats-grid */
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 1rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary, #0066cc);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Actions section */
.admin-actions h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0 0 1rem 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.action-card {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(
    --shadow-lg,
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05)
  );
}

.action-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.action-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  background-color: var(--color-primary, #0066cc);
  color: white;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.action-text h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.action-text p {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

/* Activity section */
.admin-activity h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0 0 1rem 0;
}

.activity-card {
  /* Styles handled by activity-list */
}

.activity-list {
  padding: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-icon--run {
  background-color: var(--color-primary, #0066cc);
  color: white;
}

.activity-icon--user {
  background-color: var(--color-success, #28a745);
  color: white;
}

.activity-icon--pairing {
  background-color: var(--color-warning, #ffc107);
  color: white;
}

.activity-icon svg {
  width: 1rem;
  height: 1rem;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 0.875rem;
  color: var(--color-text, #111827);
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  line-height: 1.4;
}

/* Text size support */
.text-size-small .admin-title {
  font-size: 2rem;
}

.text-size-small .admin-subtitle {
  font-size: 1.125rem;
}

.text-size-large .admin-title {
  font-size: 3rem;
}

.text-size-large .admin-subtitle {
  font-size: 1.375rem;
}

.text-size-extra-large .admin-title {
  font-size: 3.5rem;
}

.text-size-extra-large .admin-subtitle {
  font-size: 1.5rem;
}

/* High contrast mode */
.high-contrast .admin-header {
  background: var(--color-primary, #000000);
}

.high-contrast .action-card {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .activity-item {
  border-bottom-color: var(--color-text, #000000);
}

/* Reduced motion support */
.reduced-motion .action-card {
  transition: none;
}

.reduced-motion .action-card:hover {
  transform: none;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .admin-title {
    font-size: 2rem;
  }

  .admin-subtitle {
    font-size: 1.125rem;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .admin-header {
    padding: 1.5rem 0;
  }

  .admin-main {
    padding: 1.5rem 0;
  }

  .admin-container {
    padding: 0 0.5rem;
  }
}
</style>
